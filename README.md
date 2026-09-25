# hra-api

Human Reference Atlas API (HRA API)
[Change Log](./CHANGELOG.md)

## Library

HRA-API library and server code is published to NPM at <https://www.npmjs.com/package/hra-api>.

### Client Libraries

Clients are published to NPM and PyPi:

- Angular Client: [@hra-api/ng-client](https://www.npmjs.com/package/@hra-api/ng-client)
- JavaScript Client: [@hra-api/js-client](https://www.npmjs.com/package/@hra-api/js-client)
- TypeScript Client: [@hra-api/ts-client](https://www.npmjs.com/package/@hra-api/ts-client)
- Python Client: [hra-api-client](https://pypi.org/project/hra-api-client/)

## Server

The HRA API docker image bundles the API server (Node.js) and an embedded [QLever](https://github.com/ad-freiburg/qlever)
SPARQL triple store, both managed by [pm2](https://pm2.keymetrics.io/) (see `ecosystem.config.cjs`).
QLever is installed natively from its [apt repository](https://docs.qlever.dev/quickstart/), and its index is
built at image build time (`qlever/setup-qlever-index.sh`) from the HRA KG graphs on the CDN
(`--build-arg CDN_URL=...`).

```bash
docker build -t hra-api .
docker compose up   # API on port 8080, QLever SPARQL endpoint on port 8081
```

Environment variables (use `--env` on `docker run` to override):

| Variable | Default | Description |
|---|---|---|
| `QLEVER_MEMORY` | `12G` | Memory limit for query processing and caching |
| `QLEVER_CACHE` | `4G` | Maximum size of the query result cache |
| `QLEVER_TIMEOUT` | `360s` | Default query timeout |
| `QLEVER_READONLY` | `false` | If `true`, updates are disabled and session tokens (custom datasets) are not supported |
| `QLEVER_PERSIST_UPDATES` | `false` | Persist runtime updates (session-token datasets) across QLever restarts |
| `QLEVER_RUNTIME_PARAMETERS` | `enable-distributive-union=false` | Space separated QLever runtime parameters |
| `QLEVER_PORT` | `8081` | Port of the QLever SPARQL endpoint |
| `SPARQL_UPDATE_TOKEN` | random per container start | Access token for updates to the embedded QLever |
| `SPARQL_ENDPOINT` | (embedded QLever) | Use an external SPARQL endpoint instead of the embedded QLever |
| `SPARQL_BACKEND` | `blazegraph` for external endpoints | The type of an external endpoint: `qlever` or `blazegraph` |

When using the library (or running the server) against an external endpoint, set `SPARQL_BACKEND` to match it.
The library works with both QLever and Blazegraph endpoints (e.g., <https://lod.humanatlas.io/sparql>).

### Comparing backends

`test/compare` contains a harness that checks the QLever-based API against the previous Blazegraph-based API
for correctness and performance. See [test/compare/README.md](./test/compare/README.md).

## Using HRA-API from Python Notebooks

See the [notebooks folder](https://github.com/x-atlas-consortia/hra-api/tree/main/notebooks) for a showcase of various ways to use the HRA-API from Python. All the client libraries are built with [@openapitools/openapi-generator-cli](https://www.npmjs.com/package/@openapitools/openapi-generator-cli). If you are using another programming language, the usage will be similar.
