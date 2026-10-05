# Changelog

Changelog for the Human Reference Atlas API (HRA-API)

## Unreleased
- `hra-pop/cell-summary-report` is about 2x faster on QLever (a new query for its RUI locations; QLever took longer
  to plan the previous query than to run it, which is kept for Blazegraph as `construct-rui-locations-blazegraph.rq`)
- Fix `hra-pop/cell-summary-report` RUI locations: tissue blocks were linked to the datasets of their sections, and
  only the dataset a block was found by was included; sections (and their datasets) were missing because the HRApop
  sections have no section numbers
- QLever health check: QLever is restarted automatically when it has not answered queries for longer than the
  query timeout (`QLEVER_HEALTH_*` settings, `QLEVER_HEALTH_CHECK=false` disables it)
- Session-token datasets survive QLever restarts (`QLEVER_PERSIST_UPDATES` now defaults to `true`); expired and failed
  ones are still deleted by the daily pruning
- Session-token datasets whose build was interrupted are reported as failed after an hour without progress, and
  rebuilt from scratch on the next request (leftovers of an interrupted build are no longer reported as ready)
- The hra-pop routes use the configured SPARQL endpoint (the embedded QLever) instead of lod.humanatlas.io
- Fix `hra-pop/rui-location-cell-summary` failing on standards compliant triple stores (re-bound variable)
- Fix `hra-pop/cell-summary-report`: the organ filter only applied to anatomical structure sources; the RUI
  locations of every sectioned tissue block were returned; tools and modalities were mixed up between the cell
  summaries of a source; deterministic labels and ordering; faster on QLever
- Service worker fixes: error responses and POST request bodies (collisions, corridor, spatial placement,
  mesh-3d-cell-population) failed; `hra-pop/supported-tools` was registered without its `/api/hra-pop/` prefix;
  `hra-pop/cell-summary-report` ignored its JSON body; `mesh-3d-cell-population` was not registered correctly;
  JSON-encoded query parameters were not decoded; status codes now match the server's
- Service worker: add `consortium-names` and `session-token` (always the default dataset); the filter-independent
  routes (tree models, reference organs, rui-reference-data, ASCT+B sheet configs, FTU illustrations) are forwarded to
  the HRA API (`SW_API_ENDPOINT`), as their queries time out on lod.humanatlas.io
- The service worker's SPARQL endpoint is set with `SW_SPARQL_ENDPOINT` at build time (instead of `SPARQL_ENDPOINT`)
- `sw-loader.js` registers the service worker relative to the page (not the document base) and reloads once it takes
  control, instead of reloading until it does
- Update the EUI service worker example (`eui-client-side`) to the current EUI; add service worker tests
  (`npm run test:sw`)
- Remove the `/kg` routes (`/kg/digital-objects`, `/kg/do-search` and `/kg/asctb-term-occurences`)
- Replace the embedded Blazegraph triple store with QLever (installed natively via apt, index built at image build time)
- CONSTRUCT queries now request N-Triples and convert to JSON-LD locally (works with both QLever and Blazegraph)
- Add `SPARQL_BACKEND` and `SPARQL_UPDATE_TOKEN` settings; updates to the embedded QLever require an access token
  that is generated per container start
- Session-token datasets are loaded via the SPARQL Graph Store HTTP Protocol when using QLever
- Fix queries that relied on Blazegraph's non-standard handling of `GRAPH` patterns outside the query's dataset
  (`FROM NAMED`) and of nested `GRAPH` patterns
- Fix queries that re-bound already bound variables with `BIND` (invalid SPARQL)
- Fix `/kg/asctb-term-occurences` filters being nested in a GRAPH pattern (no results on standards compliant stores); faster HRA version filter
- Fix pruning of expired session-token datasets not removing their enrichment graphs
- Fix tissue-blocks dropping blocks without section counts on standards compliant triple stores (leading OPTIONAL)
- Fix sections shared by multiple tissue blocks being dropped from the tissue blocks response
- CONSTRUCT results are sorted before JSON-LD framing, so framed results no longer depend on the triple store's order
- Deterministic results where the data has conflicting duplicate values (single-valued fields, tree model parents,
  spatial placements); previously the chosen value depended on the triple store's row order
- Filtered "Tissue Datasets" counts in aggregate results now include section datasets consistently
- Faster filtered queries on both backends (the filter subquery only projects the variables it restricts)
- SPARQL errors are now reported instead of being parsed as results; CONSTRUCT results are parsed incrementally
- Failed SPARQL queries now result in a 500 error instead of an (incorrect) empty result, and errors in async
  route handlers no longer crash the server
- Faster query planning: patterns of each entity are grouped in the scene, scene-organs, tissue-blocks and
  rui-locations queries
- Plain http connections (e.g., to the embedded triple store) are no longer kept alive, which added ~40ms per query with QLever
- Filter subqueries are joined before optional patterns when possible (faster on QLever and Blazegraph)
- The docker image runs the API server as multiple processes (`API_INSTANCES`, default 4) behind HAProxy, which
  queues requests and passes each one to the next process with a free slot (`ACTIVE_QUERIES`, now 1 per process),
  so large responses no longer block other requests
- `/kg` and `/ds-graph` requests are now queued like the other API requests
- HAProxy logs each request with its queue and response times, drops queued requests whose client has disconnected,
  and does not send requests to a restarting API process
- Pin pm2 to 6.0.14 in the docker image (pm2 7 can start an app twice on restart, leaving it in a crash loop)
- `ACTIVE_QUERIES` no longer limits a directly run server by default (set it to queue requests in the server);
  concurrent session-token dataset builds are limited by the new `DATASET_BUILDS` setting (per process; default 1 in the docker image, 2 otherwise)
- `PRUNING_SCHEDULE` can be set to an empty string to disable pruning of session-token datasets
- Add a Blazegraph vs QLever comparison harness (`test/compare`)

## 0.18.0 - 2026-01-09
- Update npm dependencies
- Update OpenApiTools to version 7.18.0
- Remove custom spec preprocessing as the generators can now correctly handle all features in the spec (allOf, oneOf, enum, etc.)
- Add missing schema properties
- Fix minor server bugs
- Return 400 status code on invalid request body or query parameters instead of a 404

## 0.17.0 - 2025-10-28
- Further updates to serialization and deserialization of complex query parameters 'age', 'bmi', and 'spatial'.
  Each of these now need to be converted into json before being passed to the client libraries.

## 0.16.1 - 2025-10-23
- Update serialization style for the 'age' and 'bmi' query parameters
- Update deserialization to handle json encoded strings for the 'age' and 'bmi' query parameters

## 0.16.0 - 2025-08-25
- Update openapi generator to version 7.15.0
- Update ng-client to Angular 20
- Add missing metadata for multiple clients

## 0.15.0 - 2025-07-30
- Added feature to '/kg/do-search' to filter DOs by HRA version

## 0.14.0 - 2025-07-03
- Added '/kg/do-search' and '/kg/asct-term-occurences' route for the KG explorer
- Added '/v1/consortium-names' for the EUI
- Rearranged routes to be in alphabetical order in the OpenAPI Spec
- Bug fixes

## 0.13.0 - 2025-06-12

- Added '/v1/ftu-illustrations' route for the FTU explorer (also hosted at /ftu-explorer/)
- Docker container can now build an internal blazegraph against a given HRA KG deployment
- Use staging versions of the EUI and RUI for latest improvements
- Added initial hra-kg route

## 0.12.2 - 2025-02-27

- The '/cell-summary-report' route in hra-pop now accepts an optional tool in requests
- Further improved typings in hra-pop OpenAPI routes

## 0.12.1 - 2025-02-25

- Added OMAP and ASCT+B sheet config routes to provide reference data to the ASCT+B Reporter
- Improved typings in hra-pop OpenAPI routes

## 0.12.0 - 2025-01-29

- Updated supported angular version to 19
- Improved dataset graph handling
- Bug fixes

## 0.11.0 - 2024-09-30

## Added in 0.11.0

- Added support for uploading dataset graphs via embedded json-ld in the session-token request
- Stability improvements when loading custom data sources via the session-token route
- Updated example [notebooks](https://github.com/x-atlas-consortia/hra-api/tree/main/notebooks)
- Updated queries for HuBMAP and SenNet dataset graphs to work with their evolving search APIs
- Added [grlc](https://apps.humanatlas.io/api/grlc/) routes to run SPARQL queries against the HRA KG via Grlc

## 0.10.0 - 2024-08-20

## Added in 0.10.0

- Added /v1/mesh-3d-cell-population route
- Added consortia to aggregate results
- Improved operationIds which will make the API clients have better function names
- Other OpenAPI improvements

## 0.9.0 - 2024-08-20

## Added in 0.9.0

- Added 4 new /v1 routes: ds-graph, extraction-site, collisions, and corridor. See <https://apps.humanatlas.io/api/> for more information / interactive UI.
- Added python notebooks to showcase using HRA-API from python in the [notebooks folder](https://github.com/x-atlas-consortia/hra-api/tree/main/notebooks).
- The hra-api server now purges old datasets after 24 hours when it is using a writable SPARQL server.
- Removed some old code/dependencies from the x-atlas-consortia dataset graph generator.
- Added @andreasbueckle as a contributor. He is creating python notebooks to document and use the hra_api_client from python.

## 0.8.0 - 2024-07-02

## Added in 0.8.0

- Added routes for HuBMAP, SenNet, GTEx, and Atlas-D2K that generate ds-graph data on the fly using each Consortia's API.

## 0.7.0 - 2024-06-27

## Added in 0.7.0

- Added a new route /v1/session-token for creating a new dataset graph for immediate querying by the HRA-API
- Updated the Docker container to create and launch an internal blazegraph db for storing and querying dataset graphs
- Added a staging deployment of the hra-api for beta testing releases

## 0.6.0 - 2024-05-21

### Added in 0.6.0

- Updated all queries to use the HRA-API digital object collection instead of the deprecated CCF.OWL graph. In HRA v2.1, the CCF.OWL will no longer be updated.
- Added code to build clients for Angular (@hra-api/ng-client), JavaScript (@hra-api/js-client), TypeScript (@hra-api/ts-client), and Python (hra_api_client). These built client libraries are published to NPM or PyPi depending on the client.
- Added RUI support to the HRA-API. It can now generate the reference data needed by the RUI.
- Added /eui/ and /rui/ routes that use the HRA-API instance it's hosted on for it's backend.

## 0.5.0 - 2024-01-29

### Added in 0.5.0

- Initial version that uses the dataset graphs and the CCF.OWL hosted by the HRA Knowledge Graph (HRA-KG) to implement the CCF-API v1 routes
