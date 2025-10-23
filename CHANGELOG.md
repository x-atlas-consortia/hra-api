# Changelog

Changelog for the Human Reference Atlas API (HRA-API)

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
