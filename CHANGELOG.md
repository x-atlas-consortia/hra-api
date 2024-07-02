# Changelog

Changelog for the Human Reference Atlas API (HRA-API)

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
