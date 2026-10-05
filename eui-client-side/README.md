# HRA-API client-side

This directory contains an example of running the HRA API in the browser as a service worker, with the Exploration
User Interface (EUI) connected to it. All API requests from the page to `<origin>/api/...` are answered by the
service worker, which queries the public SPARQL endpoint (<https://lod.humanatlas.io/sparql>) directly. Only the
routes that do not depend on a filter (e.g., the ontology tree model; their queries take longer than the public
endpoint allows) are forwarded to the HRA API (<https://apps.humanatlas.io/api>), which has them precomputed.

- `index.html`: the EUI, configured to use the service worker's API
- `sw-loader.js`: registers the service worker (a copy of `dist/sw-loader.js`) and reloads the page once it is active
- `sw.js`: the service worker, loaded from the latest `hra-api` 0.x release on unpkg

To try it, serve this directory over http(s) (service workers need a secure context, `localhost` counts as one):

```bash
cd eui-client-side
python3 -m http.server 8000   # then open http://localhost:8000/
```

To use your own build (e.g., with another SPARQL endpoint or HRA API), replace `sw.js` with `dist/sw.js` from
`SW_SPARQL_ENDPOINT=<endpoint> SW_API_ENDPOINT=<api> npm run build:code`.

The service worker provides the `/api/v1/...` and `/api/hra-pop/...` routes of the server, except the ones that need
the server: session tokens always use the default dataset (custom datasets need a writable triple store), and the
`ds-graph` and `v1/sparql` routes are not available. `npm run test:sw` checks that its responses match the server's
(see `test/service-worker/README.md`).
