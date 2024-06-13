# Changelog

Changelog for the Human Reference Atlas API (HRA-API)

## 0.6.0 - 2024-05-21

### Added in 0.6.0

- Updated all queries to use the HRA-API digital object collection instead of the deprecated CCF.OWL graph. In HRA v2.1, the CCF.OWL will no longer be updated.
- Added code to build clients for Angular (@hra-api/ng-client), JavaScript (@hra-api/js-client), TypeScript (@hra-api/ts-client), and Python (hra_api_client). These built client libraries are published to NPM or PyPi depending on the client.
- Added RUI support to the HRA-API. It can now generate the reference data needed by the RUI.
- Added /eui/ and /rui/ routes that use the HRA-API instance it's hosted on for it's backend.

## 0.5.0 - 2024-01-29

### Added in 0.5.0

- Initial version that uses the dataset graphs and the CCF.OWL hosted by the HRA Knowledge Graph (HRA-KG) to implement the CCF-API v1 routes
