# HRA API: Blazegraph → QLever migration report

Branch: `qlever`, based on `main` at `940951d`. Latest measured commit: `6d96524`. Report date: 2026-09-30.

This report documents the replacement of the embedded Blazegraph 2.1.5 triple store with QLever 0.6.0, how the
new build was compared with the current production build, the results, and every behaviour change a reviewer
should know about. A shorter summary is in [qlever-migration.md](./qlever-migration.md), and the harness is
described in [../test/compare/README.md](../test/compare/README.md).

---

## 1. Executive summary

- **Correctness.** The last full parity run covered 3,093 API cases, including 2,448 deduplicated production
  requests from the CloudFront logs. No unexplained differences were left:
  - 3,071 were identical or differed only in order;
  - 19 were external differences (routes that proxy `lod.humanatlas.io` on both backends);
  - 3 failed on Blazegraph only;
  - there were 0 QLever errors.

  A curated re-check after the last code changes (645 cases) also passed. At the SPARQL level, 533 of 550
  captured queries return identical results on both engines.
- **Performance.** QLever is faster overall, often dramatically.
  - Geometric mean of the per-case p50 ratios is **0.45× uncached and 0.32× warm**.
  - Sums of the medians: 542 s vs 1,249 s (uncached) and 520 s vs 1,282 s (warm).
  - QLever was faster in 116 (uncached) and 134 (warm) of 159 cases.
  - A load test at concurrency 8 finished in **22 min vs 45 min**.

  Against the plan's strict gate (p95 ≤ 1.2× per case, cases under 50 ms exempt), 12 of 159 cases fail uncached
  and 1 fails warm. With a 100 ms absolute tolerance, 3 remain uncached and 0 warm. The remaining gaps are
  sub-second: 60–300 ms on filtered aggregate results, reference organs and one FTU case.
- **Operations.**
  - The image is 1.14 GB instead of 3.96 GB.
  - The QLever index builds in ~15 s (the whole image in 2–3.5 min instead of ~6).
  - There is no Java.
  - Session-token datasets build in 4–9 s instead of 4–12 s.
- **Along the way** the comparison found several pre-existing bugs, which are fixed on the branch (§6). Some of
  them change API output in small, deliberate ways, so **please review §6**.
- **Blazegraph itself was the least reliable part of the test setup.** It ran out of memory, hung for hours
  under concurrent load, and its journal became corrupted after restarts. Details are in §8; these are relevant
  to the current production deployment.

**Recommendation.** The branch is functionally ready. Before merging, decide on the performance gate (§5.4),
review the behaviour changes in §6, and do a final check on reliable hardware (§9). Your pending pm2
cluster-mode change was not part of these measurements.

---

## 2. What changed

| | Before (`main`) | After (`qlever`) |
|---|---|---|
| Triple store | Blazegraph 2.1.5 (Java 8, 12 GB heap), journal built with blazegraph-runner | QLever 0.6.0 from the [QLever apt repository](https://docs.qlever.dev/quickstart/) (`qlever-bin` + `qlever-control`), run natively |
| Base image | `eclipse-temurin:8-jre-jammy` + Node 22 | `node:22-bookworm-slim` |
| Data load | `blazegraph/setup-blazegraph-db.sh` (8 named graphs from the CDN) | `qlever/setup-qlever-index.sh` (same graphs and graph IRIs, `qlever index` with `MULTI_INPUT_JSON`) |
| Processes | pm2: API + Blazegraph | pm2: API + `qlever-server` (`qlever/entrypoint.sh`) |
| Updates | Open on port 8081 unless `BLAZEGRAPH_READONLY` | Require an access token (`SPARQL_UPDATE_TOKEN`, random per container start), so the exposed port 8081 is read-only to outsiders |
| Configuration | `BLAZEGRAPH_*` | `QLEVER_MEMORY`, `QLEVER_CACHE`, `QLEVER_TIMEOUT`, `QLEVER_READONLY`, `QLEVER_PERSIST_UPDATES`, `QLEVER_RUNTIME_PARAMETERS`, `QLEVER_PORT`; plus `SPARQL_BACKEND` and `SPARQL_UPDATE_TOKEN` for the library |

The JavaScript implementation stays, and the library still works against Blazegraph endpoints such as
`lod.humanatlas.io`. `SPARQL_BACKEND` defaults to `blazegraph` for external endpoints.

Default QLever runtime parameters (`QLEVER_RUNTIME_PARAMETERS`):
- `enable-distributive-union=false`: with the default, planning the filtered queries took minutes.
- `construct-deduplication=full`: CONSTRUCT results are otherwise not sets, and responses exceeded 512 MB.

---

## 3. How it was tested

### 3.1 Setup

- **Images.** `hra-api:blazegraph-baseline` was built from `main` and `hra-api:qlever` from the branch, both
  from **the same local snapshot of the CDN graphs**. The QLever image was rebuilt after each change, and the
  index of the final image was verified to have identical triple, subject and object counts per graph.
- **Containers.** Both run side by side on one machine (20 cores, 251 GB RAM), using host networking and
  separate ports. The file cache is disabled (`FILE_CACHE_DIR` points to an empty directory), so every route is
  computed live.
- **Separating code changes from engine differences.** A third instance runs the branch code against the
  baseline's Blazegraph (`SPARQL_BACKEND=blazegraph`). This gives two comparisons:
  - **engine parity**: new code on Blazegraph vs new code on QLever;
  - **code changes**: old code vs new code, both on Blazegraph.

### 3.2 Cases

- **Curated (645)**, generated by `test/compare/lib/curated-cases.js`:
  - every triple-store-backed route;
  - a filter matrix of 19 filters, including the EUI's JSON-encoded defaults, spatial searches and
    combinations;
  - token-scoped variants for every session dataset;
  - reference organ scenes;
  - edge cases;
  - every request example in the OpenAPI spec.
- **Production log replay (2,448)** by `test/compare/logs-to-cases.js`:
  - 1.85 M CloudFront requests (Jan–Sep 2026) were deduplicated by their parsed meaning, using the server's own
    query parsing, to 13,615 distinct requests.
  - Per route, the most frequent half plus a deterministic sample of the rest were kept, up to 250 per route.
- **Session-token datasets (7)**, built on both backends before each run and timed end to end:
  - The request bodies of the four most used production tokens were recovered by matching md5s:
    - HuBMAP portal (42 k requests);
    - GTEx portal (37 k);
    - `collection/ds-graphs`;
    - HuBMAP + SenNet + GTEx.
  - SenNet;
  - an inline JSON-LD source;
  - a broken source that must end in `Error`.
- **SPARQL level**: the exact queries the API sends were captured through a logging proxy and replayed directly
  against both engines (`sparql-compare.js`).

### 3.3 Comparison

Each response is classified as:

| Category | Meaning |
|---|---|
| `identical` | Deep-equal JSON, or identical text |
| `order-only` | Equal when arrays are treated as multisets |
| `embedding-only` | Equal after flattening framed JSON-LD to facts |
| `different` | A real difference |
| `error` | The candidate failed |
| `baseline-error` | Only the baseline failed |

- Numbers are compared with a relative tolerance of 1e-9, and blank node labels are ignored.
- Volatile fields are excluded: generated placement ids and dates, and dataset load timestamps.
- Reviewed differences are recorded in `test/compare/allowlist.json`.

### 3.4 Performance

- **Cases.** 159 in total: the curated `perf` cases plus the 3 most frequent log cases per route.
- **Runs.** Per case: 2 warm-up and 8 timed runs, alternating the two backends to cancel out drift, with a
  budget of 90 s per case and backend.
- **Uncached mode.** QLever's cache is cleared before every request. Blazegraph has no result cache, so this is
  the fair comparison.
- **Warm mode.** Repeated requests, which is what production sees.
- **Load test.** 477 requests at concurrency 8, run against each backend in turn.
- **Gate from the plan.** p95(B) ≤ 1.2 × p95(A) per case, with cases under 50 ms exempt, and a geometric mean of
  the p50 ratios ≤ 1. Results are also reported with a 100 ms absolute tolerance.

---

## 4. Correctness results

### 4.1 Engine parity (new code on Blazegraph vs new code on QLever)

| Run | Cases | identical | order-only | different (reviewed) | baseline-error | error |
|---|---|---|---|---|---|---|
| Full, commit `4d6606e` (2026-09-26, before the keep-alive fix, which does not affect results) | 3,093 | 2,748 | 323 | 19 | 3 | 0 |
| Curated, commit `6d96524` (2026-09-29, final image) | 645 | 591 | 50 | 1 | 3 | 0 |

- **The 19 and 1 reviewed differences are all external.** `/v1/sparql` proxies to `lod.humanatlas.io` when the
  store is writable (unchanged behaviour). `/hra-pop/*` always queries `lod.humanatlas.io` (see §7). The remote
  results are unordered or time-dependent.
- **Order-only differences** come mainly from string ordering. QLever orders strings with a locale-aware
  collation (e.g. `SenNet` < `SPARC`), Blazegraph by code point.
- **Baseline errors**: Blazegraph failed or timed out and QLever answered.
- **All 7 session-token datasets** reached the same state on both backends (6 `Ready`, the broken one `Error`).

### 4.2 SPARQL level (550 captured queries)

533 are identical. The other 17 are:
- dataset timestamps;
- numeric formatting (QLever returns doubles with ~13 significant digits);
- duplicate rows. Blazegraph's union default graph does not deduplicate triples that are in several graphs;
  QLever does. The API code is insensitive to this.

### 4.3 Code changes (old code vs new code, both on Blazegraph)

This comparison was hard to complete, because running two API instances against one Blazegraph repeatedly
exhausted Blazegraph (§8).

- **Curated run (645 cases, 2026-09-26):** 443 identical, 78 order-only and 110 different. All differences were
  reviewed and trace back to the intentional fixes in §6. There were also 9 errors and 5 baseline errors, caused
  by Blazegraph failures and external services.
- **Full run (3,093 cases, 2026-09-28):** 1,921 identical, 144 order-only, 253 different, 376 errors and
  399 baseline errors.
  - The spot-checked differences fall into the same categories as the curated run.
  - The errors came from Blazegraph, which went out of memory and hung partway through the run.
  - The run was later found to have used a Blazegraph journal with a checksum error (§8).
  - Later attempts also ended with Blazegraph out of memory.
  - This comparison is therefore complete only for the curated cases.

Differences by route, with their causes (all from §6):

| Route(s) | What differs | Cause |
|---|---|---|
| tree models | Parent/children of nodes with several parents | Deterministic parent choice |
| tissue-blocks | Chosen value when a block has conflicting duplicate values; sections that were previously dropped | Deterministic single values; shared sections resolved |
| aggregate-results (filtered) | "Tissue Datasets" count (e.g., 8,603 → 8,644) | Consistent counting of section datasets |
| scene, ds-graph, rui-locations | Placement/dimension of entities with conflicting duplicate values | Deterministic choice |
| several | 200 → 500 when Blazegraph failed mid-response | Errors are now reported instead of returning empty results |

---

## 5. Performance results

Final run: commit `6d96524` (includes the keep-alive fix), 2026-09-29/30.

### 5.1 Summary

| Mode | Cases | QLever faster | Sum of p50 (Blazegraph → QLever) | Geomean p50 ratio | Geomean p95 ratio | Strict gate failures | Beyond 100 ms tolerance |
|---|---|---|---|---|---|---|---|
| Uncached | 159 | 116 | 1,249 s → 542 s | **0.45×** | 0.46× | 12 | 3 |
| Warm | 159 | 134 | 1,282 s → 520 s | **0.32×** | 0.32× | 1 | 0 |

Load test (the same 477 requests, concurrency 8):

| | Wall time | p50 | p95 | max |
|---|---|---|---|---|
| Blazegraph | 44.9 min | 10.3 s | 133 s | 296 s |
| QLever | **21.9 min** | 3.9 s | 93 s | 301 s |

Session-token dataset pipeline (POST to `Ready`):

| Dataset | Blazegraph | QLever |
|---|---|---|
| hubmap | 8.9 s | 4.6 s |
| gtex-hubmap | 7.5 s | 5.1 s |
| ds-graphs | 12.0 s | 8.6 s |
| hubmap-sennet-gtex | 10.3 s | 8.7 s |
| sennet | 4.3 s | 4.3 s |
| inline | 1.0 s | 2.1 s |
| broken (→ Error) | 0.7 s | 1.1 s |

### 5.2 Per route (uncached, median of the per-case p50s)

| Route | n | Blazegraph | QLever | Geomean ratio |
|---|---|---|---|---|
| asctb-sheet-config | 3 | 85.9 s | 0.41 s | 0.00 |
| asctb-omap-sheet-config | 2 | 50.2 s | 0.26 s | 0.01 |
| ontology-tree-model | 4 | 36.0 s | 0.46 s | 0.01 |
| biomarker-term-occurences | 9 | 3,036 ms | 144 ms | 0.14 |
| anatomical-systems-tree-model | 2 | 2,638 ms | 418 ms | 0.16 |
| cell-type-term-occurences | 9 | 1,666 ms | 113 ms | 0.18 |
| biomarker-tree-model | 4 | 1,677 ms | 426 ms | 0.25 |
| cell-type-tree-model | 4 | 712 ms | 190 ms | 0.27 |
| gtex rui_locations / gtex-rui-locations | 7 | 4.3 s | 1.2 s | 0.29–0.34 |
| ontology-term-occurences | 9 | 479 ms | 130 ms | 0.36 |
| hubmap rui_locations / hubmap-rui-locations | 7 | 27 s | 13 s | 0.47–0.53 |
| kg/asctb-term-occurences | 4 | 191 ms | 97 ms | 0.48 |
| ds-graph | 9 | 7.0 s | 4.8 s | 0.51 |
| technology-names | 6 | 59 ms | 41 ms | 0.54 |
| kg/do-search | 4 | 54 ms | 67 ms | 0.71 |
| db-status | 3 | 26 ms | 15 ms | 0.73 |
| tissue-blocks | 9 | 3,644 ms | 3,560 ms | 0.78 |
| scene | 9 | 593 ms | 648 ms | 0.78 |
| reference-organ-scene | 7 | 1,200 ms | 837 ms | 0.84 |
| tissue-provider-names | 2 | 40 ms | 36 ms | 0.88 |
| aggregate-results | 9 | 301 ms | 312 ms | 0.99 |
| rui-reference-data | 3 | 89.9 s | 88.9 s | 0.99 |
| kg/digital-objects, hra-pop/*, sparql | 13 | – | – | 0.98–1.02 (these do not use the embedded store; see §7) |
| extraction-site | 3 | 129 ms | 158 ms | 1.11 |
| ftu-illustrations | 2 | 1,131 ms | 1,384 ms | 1.17 |
| reference-organs | 4 | 137 ms | 178 ms | 1.34 |
| provider-names | 6 | 23 ms | 38 ms | 1.37 |
| consortium-names | 6 | 21 ms | 41 ms | 1.84 |

Warm mode is faster for almost every route; for example, extraction-site takes 146 → 42 ms and aggregate-results
296 → 136 ms. Only the facet lists (consortium and provider names, 21–23 → 24–31 ms) and reference organs
(136 → 144 ms) are marginally slower.

Several of these routes are served from the build-time **file cache in production**, so their live query times
rarely matter there: reference organs, the tree models, ftu-illustrations, rui-reference-data and the ASCT+B
sheet configs.

### 5.3 Cases failing the strict gate (uncached)

| Case | Blazegraph p95 | QLever p95 | Note |
|---|---|---|---|
| aggregate-results, combined filter | 327 ms | 625 ms | Beyond tolerance. Planning (~130 ms) plus QLever evaluating the dataset OPTIONAL over all datasets before joining |
| ftu-illustrations | 1,194 ms | 1,478 ms | Beyond tolerance. File-cached in production |
| aggregate-results (log case) | 329 ms | 452 ms | Beyond tolerance |
| reference-organs (4 cases) | 132–152 ms | 196–215 ms | File-cached in production |
| extraction-site (2 cases) | 140–143 ms | 182–227 ms | 2 queries (placement lookup + CONSTRUCT); warm: 42 ms vs 146 ms |
| consortium-names (2 cases) | 22–23 ms | 52–56 ms | Uncached planning overhead; warm ~31 ms |
| kg/do-search | 59 ms | 73 ms | |

The only warm failure is one reference-organs case: 149 → 204 ms.

### 5.4 Decision needed: the performance gate

Under the plan's strict gate the run formally fails: 12 uncached cases, all within 60–300 ms absolute. With a
100 ms absolute tolerance, 3 uncached and 0 warm cases fail. Every aggregate measure is 2–3× better on QLever.

My suggestion is to accept the migration on these terms:
- the aggregate measures;
- no case more than 100 ms slower in warm mode (production traffic);
- the filtered aggregate-results case as a known, sub-second regression.

That is your decision.

### 5.5 History of the performance work

| Change | Effect |
|---|---|
| `enable-distributive-union=false` | Filtered queries: planning went from minutes to ~0.1 s |
| `construct-deduplication=full` | Large CONSTRUCTs no longer exceed 512 MB |
| Group each entity's patterns (`{ }` per star) | QLever's planner degrades steeply above ~10 patterns in one group. Examples: scene-organs 0.84 → 0.15 s; filtered scene 0.77 → 0.23 s; rui-locations > 5 min → 7 s |
| Filter subquery projects only the variables it restricts | Joins on possibly unbound variables are very slow in QLever. Filtered term occurrences: 5.6 s → 0.09 s (Blazegraph 1.2 → 0.16 s) |
| Drop the subquery's dataset OPTIONALs when there are no dataset filters | ~2× on filtered queries, on both engines |
| Join the filter subquery before the OPTIONALs (`#{{EARLY_FILTER}}`) | QLever otherwise evaluates all optionals first. Filtered aggregates: 0.54 → 0.37 s |
| Extraction site: IRI as a constant; placement looked up first | ~300 → ~145 ms at the SPARQL level |
| **No HTTP keep-alive to the store** | Reused connections to QLever added **~40 ms to every query** (Nagle / delayed ACK). Facet routes: 50 → 15 ms; noticeable on all multi-query routes |

---

## 6. Behaviour changes to review

These are deliberate changes, and all of them also apply when running against Blazegraph.

### 6.1 Fixes needed for QLever (standards compliance; results unchanged on Blazegraph)

1. **`GRAPH <g>` without `FROM NAMED <g>`.** Blazegraph matched graphs outside the query's dataset; QLever
   follows the spec. This affected 11 queries, and every filtered query returned nothing until fixed.
2. **Nested `GRAPH` patterns** (the term filters in `base-subquery.rq` and `kg/asctb-term-occurences`) returned
   nothing on QLever. They are now sibling patterns.
3. **Leading `OPTIONAL`s in `tissue-blocks.rq`.** Under strict semantics, blocks without section counts were
   dropped. The required patterns now come first.
4. **`BIND` re-binding an already bound variable** (invalid SPARQL, in `reference-landmarks.rq` and
   `biomarker-tree-model.rq`) was rewritten. The results were verified identical on Blazegraph.
5. **CONSTRUCT results** are fetched as N-Triples and converted with `jsonld.fromRDF`, because QLever cannot
   return JSON-LD.
   - Parsing is incremental, since large responses exceeded Node's maximum string length.
   - The datatypes QLever returns, `xsd:int` and `xsd:decimal`, are mapped back to the `xsd:integer` and
     `xsd:double` used by the data.
6. **Blazegraph's query hint** (`hint:SubQuery hint:runOnce`) is only sent to Blazegraph.

### 6.2 Pre-existing bugs fixed (API output changes)

1. **Deterministic results where the data has conflicting duplicate values.** Before, the value you got depended
   on the triple store's row order, which differed between engines and even between Blazegraph runs.
   - Tree models: nodes with several parents get the smallest parent within the best rank. This matches
     Blazegraph's previous choice in most cases.
   - Single-valued fields such as labels, descriptions and provider names: the smallest value.
   - Spatial placements and dimensions: the data has 13 spatial entities and 15 placements with conflicting
     values.
   - JSON-LD framing: CONSTRUCT results are sorted before framing.
2. **Sections shared by several tissue blocks were dropped** from `/v1/tissue-blocks`. Framing embeds a section
   only once, and the post-processing discarded IRI references. They are now resolved, e.g. 3,887–3,888 → 3,889
   sections.
3. **Filtered "Tissue Datasets" counts** in `/v1/aggregate-results` left out section datasets of blocks that
   also have block datasets. For example, 8,603 → 8,644 with `sex=Female`, which is now consistent with the
   unfiltered count.
4. **Failed SPARQL queries now return 500.** Previously they returned an empty 200 (e.g., an empty `@graph`), and
   errors in async route handlers could crash the server.
5. **Pruning of expired session datasets** now also removes their enrichment graphs.
6. **pm2 daily restarts.** API and triple store both restarted at 07:00, which could make pm2 start the API twice.
   The tracked instance then stayed in an `EADDRINUSE` restart loop while an untracked one served requests; this
   was observed during testing. The API now restarts at 07:05.
7. **Extraction site** now rejects IRIs with characters that are invalid in SPARQL IRIs. The IRI used to be
   concatenated into the query unescaped.

---

## 7. Findings outside the scope of the migration

- `/hra-pop/*` and `/kg/digital-objects` call the library without an endpoint, so they always query
  `lod.humanatlas.io` instead of the embedded store.
- The GTEx portal's embedded EUI (~37 k requests in the logs) builds its session from
  `ccf-api.hubmapconsortium.org`, which no longer resolves. Its datasets presumably end up in `Error`.
- Data quality:
  - 2 tissue blocks in ds-graphs are registered to themselves (block IRI = spatial entity IRI);
  - entity IRIs are reused with conflicting values;
  - some literals use the unexpanded datatype `<xsd:integer>`.
- `ftu-illustrations.rq` reads UBERON and CL graphs that are never loaded. This was verified to be harmless:
  all labels are available in the HRA collection.
- `anatomical-systems-tree-model.rq` reads a `GRAPH <https://purl.humanatlas.io/asct-b/anatomical-systems>` that
  is not loaded, so its "prioritize ASCT+B relationships" part has no effect on either engine.

---

## 8. Operational notes and risks

### 8.1 QLever

- **Session-token datasets are not persisted** across QLever restarts (daily and on deploy), as agreed. Clients
  re-create them by posting to `/v1/session-token` again. `QLEVER_PERSIST_UPDATES=true` enables persistence.
- **Update latency grows with loaded session data.** It rose from ~0.05 s to ~0.7 s per update after 8
  HuBMAP-sized datasets (1.1 M delta triples). The daily restart resets it. If needed,
  `--rebuild-index-strategy` can fold updates into the index automatically.
- **Abandoned queries** keep running after the client disconnects, until `QLEVER_TIMEOUT` (360 s).
- **Numeric precision.** Doubles are returned with ~13 significant digits (relative error ≤ 5e-13).
- **String ordering.** `ORDER BY` uses a locale-aware collation.

### 8.2 Blazegraph (the current production engine), observed during testing

- **Out of memory.** The 12 GB heap was exhausted (`OutOfMemoryError: GC overhead limit exceeded`) by filtered
  requests on large session datasets, even with one request at a time. Blazegraph then stopped answering
  entirely until restarted.
- **Pathological queries.** Some requests take minutes: `technology-names` with a HuBMAP token and a filter takes
  180–300 s (QLever: 0.25–2.5 s). Two of them in parallel made the whole API unresponsive for hours.
- **Journal corruption.** After a restart the journal reported a checksum error at one address (> 1,000
  `ChecksumError`s), and queries touching that page failed. The container had been restarted and killed several
  times, often during session-token writes. The daily pm2 restart (SIGINT) in production has the same exposure.
- **Errors inside 200 responses.** Blazegraph sometimes reports an error inside an already started 200 response.
  The old code turned these into empty results; the new code reports a 500.

### 8.3 Test environment caveats

- The first days of testing were disturbed by an NFS I/O stall on this host (I/O pressure ~95%). Measurements
  from that period were discarded; the final numbers were taken after the reboot.
- **Possible hardware fault on this host.** The same 218 MB file was corrupted twice in transit on this machine:
  once in a copy from NFS and once in a Docker build download. Each time it was a single flipped bit (`e` → `%`,
  bit 6), while the source on NFS and on the CDN was correct. With the Blazegraph checksum error, this suggests
  memory or storage bit flips. No EDAC/ECC reporting is available to confirm. **Please have the hardware
  checked** and repeat a final run elsewhere (§9).

---

## 9. Open items before merging

1. **Decide on the performance gate** (§5.4).
2. **Review the behaviour changes** in §6.2.
3. **Your pm2 cluster-mode change** (`API_INSTANCES`, `ACTIVE_QUERIES` and `test/compare/load.js`, uncommitted
   in the working tree) was not part of these measurements. The measured image (`6d96524`) runs one API process
   with the default of 4 active queries (`ACTIVE_QUERIES`). Worth a load test with `test/compare/load.js`.
4. **Re-run on reliable hardware**, given §8.3: `npm run compare:env -- all`, then `npm run compare` and
   `npm run compare -- --perf`. Also run the staging build (`CDN_URL=.../hra-kg--staging/`).
5. **Optional:**
   - enable `QLEVER_PERSIST_UPDATES` or an index rebuild strategy if session datasets must survive restarts, or
     if many are created per day;
   - consider fixing the external-endpoint issues in §7.

---

## 10. Reproducing the results

```bash
npm run compare:env -- all              # snapshot, serve, build both images, start both containers
npm run compare:logs -- hra-api-logs.parquet
npm run compare                         # correctness (curated + log cases); report in test/compare/report/
npm run compare -- --perf --skip-correctness --perf-runs 8 --perf-warmup 2
```

Raw results for this report are in `test/compare/report/` (gitignored):

| Directory | Contents |
|---|---|
| `saved-2026-09-28/` | Full parity run, SPARQL-level comparison, earlier performance runs |
| `final-2026-09-28/perf/` | Performance run before the keep-alive fix |
| `final-2026-09-29/parity/` | Curated parity run on the final image |
| `final-2026-09-29/perf/` | Final performance run |

## 11. Commits on `qlever`

```
6d96524 Changelog
cfeffc3 Do not keep plain http connections alive (reused connections to QLever added ~40ms to every query)
b523491 Harness: --sequential option
ac62893 Harness: fully detach the snapshot server
4d6606e Join the filter subquery before optional patterns when it only binds always-bound variables
4d3bb8d Document the QLever migration results
4e6514b Faster extraction-site (placement looked up first) and reference-organs (grouped patterns); report perf gate with an absolute tolerance
2dd2a01 Stagger pm2 daily restarts (simultaneous restarts could start the API twice); harness: tolerate cache clear failures
fe870d4 Sort CONSTRUCT results before framing (deterministic across triple stores); resolve shared section references in tissue blocks; keep original frames
c70bfb5 Fix allowlist pattern
a95c09f Fix nested GRAPH in asctb-term-occurences (empty results on QLever); join HRA version filter as a subquery; harness volatile/allowlist entries
37a6021 Harness: treat baseline 5xx with candidate success as baseline-error
ea19f44 Group entity patterns for faster planning; report SPARQL errors as 500s; handle async route errors; baseline-error category
6703930 Only include the filter subquery's dataset/section patterns when filtering by them
ffba0a9 Handle errors reported by the triple store in the middle of a CONSTRUCT response
7401f6b Always embed sections in frames; only project restricted filter subquery variables; harness volatile fields and numeric tolerance
e48eb26 More QLever parity fixes; streaming N-Triples parsing
0eb4e84 Fix QLever correctness and performance issues found by the harness
0a155b8 Replace embedded Blazegraph with QLever (WIP)
```
