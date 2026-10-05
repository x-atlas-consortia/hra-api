# Service worker tests

The service worker (`dist/sw.js`, built from `src/service-worker`) runs the HRA API in the browser: it answers the
page's requests to `<origin>/api/...` by querying a SPARQL endpoint directly (<https://lod.humanatlas.io/sparql> by
default, `SW_SPARQL_ENDPOINT` at build time). The routes that do not depend on a filter are forwarded to the HRA API
(<https://apps.humanatlas.io/api> by default, `SW_API_ENDPOINT` at build time; see
`src/service-worker/routes/v1/api-routes.js`). These tests run it in a headless Chromium (Playwright's docker image):

```bash
npm run test:sw                  # = test/service-worker/run.sh
npm run test:sw -- --grep hra-pop
```

- `run.js` sends the curated harness cases (`test/compare/lib/curated-cases.js`) through the service worker and
  compares the responses with those of an HRA API server using the same SPARQL endpoint, with the harness's
  comparison (`test/compare/lib/compare.js`). Both run the same library code, so every case should pass. The
  forwarded routes are compared with the HRA API instead. A case where both sides fail (e.g., the SPARQL endpoint
  timed out, also after a retry) is reported as `unverified` and counts as a failure.
- `eui.js` opens the EUI example (`eui-client-side`) with this build of the service worker, waits until the EUI has
  loaded its data, and checks that every API request was answered by the service worker without an error.

`run.sh` builds the code, serves a test page and the EUI example (ports 48091 and 48092), starts the server to
compare with (port 48090), and runs both checks. It needs docker, python3 and network access to the SPARQL endpoint.

Not covered by the service worker (and skipped): the `ds-graph` routes (they need node), `v1/sparql`, and custom
datasets (session tokens always use the default dataset).
