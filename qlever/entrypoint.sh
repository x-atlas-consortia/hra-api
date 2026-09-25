#!/bin/bash
# Starts the QLever SPARQL server in the foreground (managed by pm2)

QLEVER_DIR=${QLEVER_DIR:-/data/qlever}
cd $QLEVER_DIR

EXTRA_ARGS=()

# Runtime parameters (space separated name=value pairs). The HRA API's filtered queries join large
# optional patterns with a UNION; QLever's distributive union optimization makes planning them take
# minutes, so it is disabled by default.
for param in ${QLEVER_RUNTIME_PARAMETERS:-enable-distributive-union=false}; do
  EXTRA_ARGS+=(--set-runtime-parameter "$param")
done
if [[ "$QLEVER_PERSIST_UPDATES" == "true" ]]; then
  EXTRA_ARGS+=(--persist-updates)
fi
if [[ -n "$SPARQL_UPDATE_TOKEN" && "$QLEVER_READONLY" != "true" ]]; then
  EXTRA_ARGS+=(--access-token "$SPARQL_UPDATE_TOKEN")
fi

exec qlever-server \
  --index-basename hra \
  --port ${QLEVER_PORT:-8081} \
  --memory-max-size ${QLEVER_MEMORY:-12G} \
  --cache-max-size ${QLEVER_CACHE:-4G} \
  --default-query-timeout ${QLEVER_TIMEOUT:-360s} \
  --num-simultaneous-queries ${QLEVER_NUM_THREADS:-8} \
  "${EXTRA_ARGS[@]}"
