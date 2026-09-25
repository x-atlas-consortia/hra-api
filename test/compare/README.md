# Blazegraph vs. QLever comparison harness

This harness checks that the QLever-based HRA API (candidate, **B**) returns the same results as the
Blazegraph-based HRA API (baseline, **A**) for every API call, and that it is not markedly slower.

Both images are built from the **same data snapshot**, so any difference comes from the engine or the code.

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

The report is written to `test/compare/report/<run id>/report.md` (plus `results.json`). The command exits
non-zero if there are unreviewed differences, dataset pipeline failures, or performance gate failures.

## What is compared

- **Session-token datasets** (`datasets.json`): each dataset is created on both backends via
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
  - edge cases;
  - every request example in the OpenAPI spec.
- **Log replay** (`logs-to-cases.js`): production GET requests are deduplicated by their *parsed* meaning,
  using the server's own query parsing. The most frequent requests plus a deterministic sample of the rest are
  kept for each route (`--max-per-route`). Tokens found in the logs are mapped to harness datasets.

## How responses are compared (`lib/compare.js`)

| Category | Meaning |
|---|---|
| `identical` | Deep-equal JSON (key order ignored), or identical text |
| `order-only` | Equal when arrays and lines are compared as multisets (e.g., QLever sorts strings with a locale-aware collation; Blazegraph uses code point order) |
| `embedding-only` | Framed JSON-LD that is equal once flattened into (node, property, value) facts. Framing embeds a node once and references it by `@id` elsewhere, and *where* depends on triple order |
| `different` | A real difference. The report lists records and facts that are only in A or only in B |
| `error` | A request failed |

Numbers are compared to 10 significant digits, and blank node labels are ignored. Reviewed and accepted
differences are recorded in `allowlist.json`, with a reason and a type (`improvement`, `intentional-fix`,
`nondeterministic`, `external`).

## Performance (`--perf`)

The performance tests use the curated cases tagged `perf` plus the most frequent log cases per route.

- Each case gets warm-up runs, then timed runs, alternating A and B to cancel drift.
- In **uncached** mode QLever's query cache is cleared before every B request, which makes it the fair
  comparison because Blazegraph has no result cache. **Warm** mode shows what production traffic sees.
- A load test runs the same cases with concurrency 8 against each backend in turn.

The gate is applied to uncached mode:

- p95(B) ≤ 1.2 × p95(A) for every case (cases under 50ms are exempt);
- the geometric mean of the p50 ratios must be ≤ 1.0.

## SPARQL-level comparison

To separate engine differences from the API's post-processing, capture the exact queries the API sends and
replay them directly against both triple stores:

```bash
npm run compare:env -- capture                     # local API (working tree) behind a logging proxy
npm run compare -- --b http://localhost:28083/     # exercise the API; queries are logged
npm run compare:sparql                             # replay the captured queries against both engines
```

## Checking the code changes against Blazegraph

The library must keep working with Blazegraph endpoints (e.g., lod.humanatlas.io). Run the working tree
against the baseline's Blazegraph with `SPARQL_BACKEND=blazegraph` and compare it with the baseline API.
Every case should be `identical`:

```bash
PORT=48080 SPARQL_ENDPOINT=http://localhost:18081/blazegraph/namespace/kb/sparql SPARQL_BACKEND=blazegraph \
  SPARQL_WRITABLE=true FILE_CACHE_DIR=/tmp/no-file-cache node dist/server.js &
npm run compare -- --b http://localhost:48080/ --cases curated --reuse-datasets
```

## Files

| File | Purpose |
|---|---|
| `orchestrate.sh` | Snapshot, image builds, containers, capture proxy |
| `run.js` | Main runner (datasets, correctness, performance, report) |
| `logs-to-cases.js` | CloudFront logs (parquet, read with the `duckdb` CLI) to cases |
| `sparql-proxy.js`, `sparql-compare.js` | SPARQL-level capture and replay |
| `construct-check.js` | Checks that CONSTRUCT via N-Triples + `jsonld.fromRDF` matches Blazegraph's native JSON-LD |
| `datasets.json` | Session-token datasets |
| `allowlist.json` | Reviewed differences |
| `lib/` | Comparison, normalization, HTTP, stats and report helpers |

Generated data (`.snapshot/`, `.state/`, `report/`, `cases/`) is gitignored.
