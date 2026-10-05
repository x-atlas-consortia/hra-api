#!/bin/bash
# Checks the service worker (dist/sw.js) in a headless browser (Playwright's docker image):
#  1. run.js: its responses match those of the server using the same SPARQL endpoint
#  2. eui.js: the EUI example (eui-client-side) works with it
# Usage: test/service-worker/run.sh [run.js options, e.g. --grep hra-pop]
set -e

HERE=$(dirname "$(readlink -f "$0")")
ROOT=$(readlink -f "$HERE/../..")
PLAYWRIGHT_IMAGE=${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.56.0-noble}
ENDPOINT=${SW_SPARQL_ENDPOINT:-https://lod.humanatlas.io/sparql}
API=${SW_API_ENDPOINT:-https://apps.humanatlas.io/api}
SERVER_PORT=${SERVER_PORT:-48090}
SITE_PORT=${SITE_PORT:-48091}
EUI_PORT=${EUI_PORT:-48092}
WORK=$(mktemp -d)
PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do kill "$pid" 2> /dev/null || true; done
  rm -rf "$WORK"
}
trap cleanup EXIT

cd "$ROOT"
SW_SPARQL_ENDPOINT=$ENDPOINT SW_API_ENDPOINT=$API npm run build:code > /dev/null

# A test page that only registers the service worker, and the EUI example using this build of the service worker
mkdir -p "$WORK/site" "$WORK/eui" "$WORK/file-cache"
cp dist/sw.js dist/sw.js.map dist/sw-loader.js "$WORK/site/"
echo '<!doctype html><html><head><meta charset="utf-8"><script src="sw-loader.js"></script></head><body></body></html>' \
  > "$WORK/site/index.html"
cp eui-client-side/index.html dist/sw-loader.js dist/sw.js dist/sw.js.map "$WORK/eui/"
(cd "$WORK/site" && exec python3 -m http.server "$SITE_PORT" --bind 127.0.0.1 > /dev/null 2>&1) & PIDS+=($!)
(cd "$WORK/eui" && exec python3 -m http.server "$EUI_PORT" --bind 127.0.0.1 > /dev/null 2>&1) & PIDS+=($!)

# The server to compare with, using the service worker's SPARQL endpoint (read-only, no file cache)
PORT=$SERVER_PORT SPARQL_ENDPOINT=$ENDPOINT SPARQL_BACKEND=blazegraph FILE_CACHE_DIR="$WORK/file-cache" \
  node dist/server.js > "$WORK/server.log" 2>&1 & PIDS+=($!)
for i in $(seq 60); do curl -sf -o /dev/null "http://localhost:$SERVER_PORT/v1/consortium-names" && break; sleep 1; done

PLAYWRIGHT=(docker run --rm --network host --ipc=host -v "$ROOT:$ROOT:ro" -v /tmp:/tmp -w "$ROOT" "$PLAYWRIGHT_IMAGE" node)
status=0
"${PLAYWRIGHT[@]}" test/service-worker/run.js --page "http://localhost:$SITE_PORT/index.html" \
  --server "http://localhost:$SERVER_PORT/" --api "$API/" "$@" || status=1
"${PLAYWRIGHT[@]}" test/service-worker/eui.js --page "http://localhost:$EUI_PORT/index.html" ${EUI_SCREENSHOT:+--screenshot "$EUI_SCREENSHOT"} || status=1
exit $status
