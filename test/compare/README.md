# HRA API comparison harness

This harness checks that a candidate HRA API (**B**, usually the working tree of a branch) returns the same results
as a baseline HRA API (**A**, usually built from `main`) for every API call, and that it is not markedly slower.

Both images are built from the **same data snapshot**, so any difference comes from the code (or the configuration).

## Quick start

```bash
# 1. Download the data snapshot, serve it, build both images (baseline from `main`) and start them
npm run compare:env -- all          # = test/compare/orchestrate.sh snapshot serve build up

# 2. (optional) Turn CloudFront access logs into replay cases
npm run compare:logs -- /path/to/hra-api-logs.parquet     # writes test/compare/cases/logs.json

# 3. Compare (correctness only), then with performance tests
npm run compare
npm run compare -- --perf

# 4. Stop everything
npm run compare:env -- down
```

The baseline runs on port 18080 (its QLever on 18081) and the candidate on 28080 (QLever on 28081). Use
`BASELINE_REF=<ref>` to build the baseline from another branch, tag or commit. After changing the working tree, run
`npm run compare:env -- build up` again: it rebuilds both images (the unchanged baseline comes from docker's build
cache) and restarts both containers.

The report is written to `test/compare/report/<run id>/report.md` (plus `results.json`). The command exits
non-zero if there are unreviewed differences, dataset pipeline failures, or performance gate failures.

To refresh the data snapshot, move `test/compare/.snapshot` away and run `npm run compare:env -- snapshot` again
(it only downloads missing files).

## What is compared

- **Session-token datasets** (`datasets.json`): each dataset is created on both APIs via
  `POST /v1/session-token`, and the harness times the pipeline end to end until `db-status` is `Ready`.
  The datasets include the request bodies of the most frequent production tokens, which were recovered
  from the access logs by matching the md5 token against candidate bodies, plus an inline JSON-LD source and
  a broken source that must end up in the `Error` state. Data sources come from the snapshot.
- **Curated cases** (`lib/curated-cases.js`) include:
  - every triple-store-backed route;
  - a filter matrix (sex, age, BMI, ontology, cell type and biomarker terms, consortiums, providers,
    technologies, spatial searches, the EUI's default JSON-encoded filter, and combinations) for the filtered
    routes;
  - token-scoped variants for every dataset;
  - reference organ scenes;
  - hra-pop cell summary reports and RUI location cell summaries;
  - edge cases and invalid requests;
  - every request example in the OpenAPI spec.
- **Log replay** (`logs-to-cases.js`): production GET requests are deduplicated by their *parsed* meaning,
  using the server's own query parsing. The most frequent requests plus a deterministic sample of the rest are
  kept for each route (`--max-per-route`). Tokens found in the logs are mapped to harness datasets.

## How responses are compared (`lib/compare.js`)

| Category | Meaning |
|---|---|
| `identical` | Deep-equal JSON (key order ignored), or identical text |
| `order-only` | Equal when arrays and lines are compared as multisets (e.g., the order of rows the triple store returns) |
| `embedding-only` | Framed JSON-LD that is equal once flattened into (node, property, value) facts. Framing embeds a node once and references it by `@id` elsewhere, and *where* depends on triple order |
| `different` | A real difference. The report lists records and facts that are only in A or only in B |
| `error` | A request to the candidate failed |
| `baseline-error` | Only the baseline failed (e.g., it timed out); listed for review, not a failure |

Numbers are compared to 9 significant digits (values below 1e-9 count as 0), numeric JSON-LD literals are compared as
numbers, and blank node labels are ignored. Values that legitimately differ between runs (e.g., generated ids and
timestamps) are removed first (`VOLATILE` in `lib/compare.js`). Reviewed and accepted differences are recorded in
`allowlist.json`, with a reason and a type (`improvement`, `intentional-fix`, `nondeterministic`, `external`).

A branch that intentionally changes responses shows those changes as `different`: review them in the report, and
add an allowlist entry if they should not be flagged again.

## Performance (`--perf`)

The performance tests use the curated cases tagged `perf` plus the most frequent log cases per route.

- Each case gets warm-up runs, then timed runs, alternating A and B to cancel drift.
- In **uncached** mode the QLever query cache of each API is cleared before every request (`--a-sparql`,
  `--b-sparql`). **Warm** mode shows what production traffic sees.
- A load test runs the same cases with concurrency 8 against each API in turn.

The gate is applied to uncached mode:

- p95(B) ≤ 1.2 × p95(A) for every case (cases under 50ms are exempt);
- the geometric mean of the p50 ratios must be ≤ 1.0.

## Load tests of one server configuration

`load.js` replays a fixed, shuffled request mix against a single API with a number of concurrent clients and reports
latencies per route, to compare server configurations (e.g., `API_INSTANCES` and `ACTIVE_QUERIES`) on the same
requests. Use the same `--seed` for every configuration, and a fresh container for each run.

```bash
# The perf cases (curated + most frequent log cases per route), each sent 3 times
node test/compare/load.js --target http://localhost:28080/ --mix harness --concurrency 8 --out harness.json
# Log cases sampled by production CloudFront misses per route (CSV with route,miss_n columns)
node test/compare/load.js --target http://localhost:28080/ --mix production --weights misses.csv --requests 600
```

The weights for the production mix can be computed from the CloudFront logs with the `duckdb` CLI:

```bash
duckdb -csv -c "SELECT regexp_replace(cs_uri_stem, '^/api/', '') AS route, count(*) AS miss_n
  FROM 'hra-api-logs.parquet' WHERE x_host_header = 'apps.humanatlas.io' AND cs_method = 'GET'
    AND sc_status < 400 AND x_edge_result_type = 'Miss' AND regexp_matches(cs_uri_stem, '^/api/(v1|hra-pop)/')
  GROUP BY ALL" > misses.csv
```

## SPARQL-level comparison

To separate triple store differences from the API's processing, capture the exact queries the API sends and
replay them directly against both triple stores:

```bash
npm run compare:env -- capture                     # local API (working tree) behind a logging proxy
npm run compare -- --b http://localhost:28083/     # exercise the API; queries are logged
npm run compare:sparql                             # replay the captured queries against both QLevers
```

## Comparing QLever settings

To compare two QLever configurations (e.g., runtime parameters), run the same image twice with different
`QLEVER_RUNTIME_PARAMETERS`, and compare the two APIs and their QLevers:

```bash
npm run compare -- --a http://localhost:28080/ --b http://localhost:38080/ \
  --a-sparql http://localhost:28081/ --b-sparql http://localhost:38081/ --perf
node test/compare/sparql-compare.js --a http://localhost:28081/ --b http://localhost:38081/ --queries captured.jsonl
```

## Checking Blazegraph compatibility

The library must keep working with Blazegraph endpoints (e.g., lod.humanatlas.io, which the service worker uses).
The service worker tests (`npm run test:sw`, see `test/service-worker/README.md`) check the library against lod.
To compare against another Blazegraph endpoint with the same data, run the working tree against it with
`SPARQL_BACKEND=blazegraph` and compare it with the baseline API (`--a-sparql ''` if the baseline does not use QLever);
`sparql-compare.js --a-blazegraph` replays captured queries against a Blazegraph endpoint.

## Files

| File | Purpose |
|---|---|
| `orchestrate.sh` | Snapshot, image builds, containers, capture proxy |
| `run.js` | Main runner (datasets, correctness, performance, report) |
| `logs-to-cases.js` | CloudFront logs (parquet, read with the `duckdb` CLI) to cases |
| `load.js` | Load test of a single API with per-route latencies |
| `diff-url.js` | Compares a single request between both APIs and prints the differences |
| `sparql-proxy.js`, `sparql-compare.js` | SPARQL-level capture and replay |
| `construct-check.js` | Checks that CONSTRUCT via N-Triples + `jsonld.fromRDF` matches Blazegraph's native JSON-LD |
| `datasets.json` | Session-token datasets |
| `allowlist.json` | Reviewed differences |
| `lib/` | Comparison, normalization, HTTP, stats and report helpers |

Generated data (`.snapshot/`, `.state/`, `report/`, `cases/`) is gitignored.
