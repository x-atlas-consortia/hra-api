# Blazegraph → QLever migration (branch `qlever`)

The embedded Blazegraph 2.1.5 triple store was replaced with QLever 0.6.0. QLever is installed natively from the
[QLever apt repository](https://docs.qlever.dev/quickstart/) and runs in the same container as the API, under pm2.
The index is built at image build time (`qlever/setup-qlever-index.sh`) from the same CDN graphs as before.

Results were checked with the comparison harness in `test/compare` (see its README). Both images were built from
the same data snapshot and run side by side.

## Summary

| | Blazegraph (main) | QLever (qlever) |
|---|---|---|
| Image size | 3.96 GB | 1.14 GB |
| Image build | ~6 min | ~2–3.5 min |
| Index / journal build | minutes (blazegraph-runner) | ~15 s |
| Session-token dataset (HuBMAP, ~130k triples) | ~6–7 s | ~5–7 s |
| Geomean p50 ratio, 159 perf cases (uncached / warm) | 1.0 | **0.58 / 0.44** |
| Load test, 477 requests at concurrency 8 | 41 min | 31 min |

### Correctness

These results are from the final parity run: the new code on Blazegraph vs the new code on QLever, over 3,093 cases
(curated cases, OpenAPI examples, token datasets, and 2,448 deduplicated production requests from the CloudFront logs).

- 2,749 identical and 325 differing only in order. The sort order of string values differs because QLever sorts
  with a locale-aware collation and Blazegraph by code point.
- 0 unreviewed failures and 0 QLever errors.
- 3 baseline errors: Blazegraph failed or timed out while QLever succeeded.
- 16 external differences: `/v1/sparql` and `/hra-pop/*` query `lod.humanatlas.io` on both backends.

At the SPARQL level, 533 of 550 captured queries return identical results. The remaining 17 differ only in
timestamps, numeric precision, and duplicate rows (Blazegraph's default graph does not deduplicate triples that
appear in several graphs).

### Performance

- **Heavy routes are much faster on QLever.** Examples:
  - ontology tree model: 0.5 s vs 31 s
  - other tree models: 3–5× faster
  - unfiltered RUI locations: 7 s vs 33 s
  - tissue blocks: 1.5–2× faster
  - ASCT+B term occurrences with HRA versions: ~0.15 s vs ~2.5 s
- **Small queries are about 20–70 ms slower.** QLever plans every query (tens of ms, even on cache hits), while
  Blazegraph answers trivial queries in ~20 ms. Examples: `consortium-names` 25 → 75 ms, `extraction-site`
  ~150 → ~250 ms uncached.
- With the strict gate (p95 ≤ 1.2× per case, cases under 50 ms exempt), 38 of 159 cases fail uncached. With an
  additional 100 ms absolute tolerance, only 3 remain: filtered aggregate results (+110 to +230 ms) and one
  extraction site (+103 ms).

## Changes needed for QLever

These changes are standards-compliant SPARQL and give identical results on Blazegraph.

- CONSTRUCT results are fetched as N-Triples, parsed incrementally, sorted, and converted with `jsonld.fromRDF`,
  because QLever cannot return JSON-LD. QLever's `xsd:int`/`xsd:decimal` output is mapped back to
  `xsd:integer`/`xsd:double`.
- Blazegraph accepted three things that QLever handles strictly:
  - `GRAPH <g>` patterns without a matching `FROM NAMED` (added)
  - nested `GRAPH` patterns (filters moved out)
  - leading OPTIONALs before the required patterns
- Two invalid `BIND`s re-bound an already bound variable (rewritten).
- Blazegraph's query hint is only sent to Blazegraph (`SPARQL_BACKEND`).
- Query planning:
  - Large basic graph patterns are grouped per entity, because QLever's planner slows down steeply beyond about
    10 patterns.
  - The filter subquery only projects the variables it restricts, because joins on possibly unbound variables are
    slow in QLever.
  - Constant IRIs are used where possible.
- QLever runtime parameters (`QLEVER_RUNTIME_PARAMETERS`):
  - `enable-distributive-union=false`: planning of the filtered queries otherwise takes minutes.
  - `construct-deduplication=full`: CONSTRUCT results are otherwise not sets, and responses exceeded 512 MB.
- Updates need an access token, generated per container start. Session-token datasets are loaded via the Graph
  Store Protocol, and named graph checks only look at the graphs they need.

## Pre-existing issues fixed along the way

- Results that depended on the triple store's row order where the data has conflicting duplicates:
  - tree-model parents
  - single-valued fields (e.g., a donor listed with two provider names)
  - spatial placements and dimensions: 13 spatial entities and 15 placements have conflicting values in the data
- Sections shared by multiple tissue blocks were dropped from `/v1/tissue-blocks`.
- Filtered "Tissue Datasets" counts in `/v1/aggregate-results` excluded some section datasets (e.g., 8,603 instead
  of 8,644).
- Failed SPARQL queries returned an empty 200 response; they now return a 500. Errors in async route handlers could
  crash the server; they are now handled.
- Pruning of expired session-token datasets did not remove their enrichment graphs.
- Both pm2 apps restarted at 07:00, which could make pm2 start the API twice and leave it in a restart loop. The API
  now restarts at 07:05.

## Known differences and notes

- QLever returns doubles with ~13 significant digits (relative error ≤ 5e-13).
- Session-token datasets are not persisted across QLever restarts (daily, or on deploy). Clients re-create them by
  posting to `/v1/session-token` again. `QLEVER_PERSIST_UPDATES=true` enables persistence.
- Update latency grows with the number of loaded session datasets (e.g., ~0.05 s → ~0.7 s after 8 HuBMAP-sized
  datasets). The daily restart resets it. `--rebuild-index-strategy` could fold updates into the index if needed.
- QLever keeps executing queries after the client disconnects, until the timeout (`QLEVER_TIMEOUT`, 360 s).

## Findings outside the scope of the migration

- `/hra-pop/*` and `/kg/digital-objects` always query `lod.humanatlas.io` instead of the configured endpoint.
- The GTEx portal's embedded EUI (~37k requests in the logs) loads data sources from `ccf-api.hubmapconsortium.org`,
  which no longer resolves.
- Two tissue blocks in the ds-graphs data are registered to themselves (the block IRI equals the spatial entity
  IRI), and some entity IRIs are reused with conflicting values.
