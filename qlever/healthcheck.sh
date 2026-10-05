#!/bin/bash
# Restarts QLever (via pm2) when it stops answering queries, e.g., when long running queries keep running past the
# query timeout and occupy all query threads. A busy QLever is not restarted: a trivial query must fail for longer
# than the query timeout before QLever is restarted, so legitimate queries always get to finish.

QLEVER_PORT=${QLEVER_PORT:-8081}
# Seconds between checks
INTERVAL=${QLEVER_HEALTH_INTERVAL:-30}
# Seconds to wait for the answer to the check query
CHECK_TIMEOUT=${QLEVER_HEALTH_TIMEOUT:-10}
# Seconds without a successful check before QLever is restarted (default: the query timeout plus a minute)
QUERY_TIMEOUT=${QLEVER_TIMEOUT:-360s}
if [[ "$QUERY_TIMEOUT" =~ ^([0-9]+)s?$ ]]; then
  QUERY_TIMEOUT=${BASH_REMATCH[1]}
else
  QUERY_TIMEOUT=360
fi
MAX_DOWN=${QLEVER_HEALTH_MAX_DOWN:-$((QUERY_TIMEOUT + 60))}
# Seconds to wait after a restart before checking again
STARTUP_GRACE=${QLEVER_HEALTH_STARTUP_GRACE:-120}

CHECK_URL="http://localhost:${QLEVER_PORT}/?query=ASK%7B%7D"

log() {
  echo "$(date -u +%FT%TZ) qlever-health: $*"
}

log "checking ${CHECK_URL} every ${INTERVAL}s, restarting QLever after ${MAX_DOWN}s without an answer"
sleep "$STARTUP_GRACE"
last_ok=$(date +%s)
failing=false

while true; do
  if curl -sf -o /dev/null --max-time "$CHECK_TIMEOUT" "$CHECK_URL"; then
    if [[ "$failing" == "true" ]]; then
      log "QLever is answering again after $(($(date +%s) - last_ok))s"
    fi
    last_ok=$(date +%s)
    failing=false
  else
    failing=true
    down=$(($(date +%s) - last_ok))
    if ((down >= MAX_DOWN)); then
      log "QLever has not answered for ${down}s, restarting it"
      pm2 restart qlever
      sleep "$STARTUP_GRACE"
      last_ok=$(date +%s)
      failing=false
      continue
    fi
    log "QLever did not answer within ${CHECK_TIMEOUT}s (no answer for ${down}s)"
  fi
  sleep "$INTERVAL"
done
