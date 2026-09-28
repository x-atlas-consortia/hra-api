#!/bin/bash
# Orchestrates a Blazegraph (baseline) vs QLever (candidate) comparison of the HRA API.
#
# Usage: test/compare/orchestrate.sh <command>...
#   snapshot   Download the CDN graphs and session-token data sources into $SNAPSHOT_DIR (once)
#   serve      Serve $SNAPSHOT_DIR over http on $SNAPSHOT_PORT (in the background)
#   build      Build the baseline image from $BASELINE_REF and the candidate image from the working tree,
#              both against the same snapshot (sequentially, host networking)
#   up         Start both containers side by side (file cache disabled, candidate update token set)
#   capture    Start a local API (working tree) behind a SPARQL logging proxy to capture queries for sparql-compare
#   down       Stop the containers, the snapshot server and the capture API
#   all        snapshot serve build up
#
# Environment (defaults):
#   SNAPSHOT_DIR=test/compare/.snapshot  SNAPSHOT_PORT=18900  BASELINE_REF=main
#   BASELINE_IMAGE=hra-api:blazegraph-baseline  CANDIDATE_IMAGE=hra-api:qlever
#   A_PORT=18080 (baseline API; Blazegraph on 18081)  B_PORT=28080 (candidate API; QLever on 28081)
#   SPARQL_UPDATE_TOKEN=harness-secret
set -e

HERE=$(dirname "$(readlink -f "$0")")
ROOT=$(readlink -f "$HERE/../..")
SNAPSHOT_DIR=${SNAPSHOT_DIR:-$HERE/.snapshot}
SNAPSHOT_PORT=${SNAPSHOT_PORT:-18900}
SNAPSHOT_URL="http://localhost:${SNAPSHOT_PORT}/"
CDN_URL=${CDN_URL:-https://cdn.humanatlas.io/digital-objects/}
BASELINE_REF=${BASELINE_REF:-main}
BASELINE_IMAGE=${BASELINE_IMAGE:-hra-api:blazegraph-baseline}
CANDIDATE_IMAGE=${CANDIDATE_IMAGE:-hra-api:qlever}
A_PORT=${A_PORT:-18080}
B_PORT=${B_PORT:-28080}
SPARQL_UPDATE_TOKEN=${SPARQL_UPDATE_TOKEN:-harness-secret}
STATE_DIR=$HERE/.state
mkdir -p $STATE_DIR

GRAPHS="collection/hra collection/hra-api graph/hra-ccf-patches graph/hra-pop collection/ds-graphs graph/ds-graphs-enrichments collection/hra-millitomes"
SOURCES="hubmap.jsonld=https://apps.humanatlas.io/api/ds-graph/hubmap?token=
sennet.jsonld=https://apps.humanatlas.io/api/ds-graph/sennet
gtex.jsonld=https://apps.humanatlas.io/api/ds-graph/gtex"

snapshot() {
  local d=$SNAPSHOT_DIR/digital-objects
  mkdir -p $d $SNAPSHOT_DIR/sources
  [ -s $d/catalog.ttl ] || curl -sSfL "${CDN_URL}catalog.ttl" -o $d/catalog.ttl
  for g in $GRAPHS; do
    mkdir -p $d/$g/latest
    [ -s $d/$g/latest/graph.ttl ] || { echo "Downloading $g"; curl -sSfL "${CDN_URL}$g/latest/graph.ttl" -o $d/$g/latest/graph.ttl; }
  done
  echo "$SOURCES" | while IFS='=' read -r file url; do
    [ -s $SNAPSHOT_DIR/sources/$file ] || { echo "Downloading $url"; curl -sSfL --max-time 1800 "$url" -o $SNAPSHOT_DIR/sources/$file; }
  done
  date -u +%FT%TZ > $SNAPSHOT_DIR/SNAPSHOT_DATE
  echo "Snapshot ready in $SNAPSHOT_DIR ($(cat $SNAPSHOT_DIR/SNAPSHOT_DATE))"
}

serve() {
  if curl -sf -o /dev/null "${SNAPSHOT_URL}digital-objects/catalog.ttl"; then
    echo "Snapshot server already running on $SNAPSHOT_PORT"
    return
  fi
  (cd $SNAPSHOT_DIR && setsid nohup python3 -m http.server $SNAPSHOT_PORT --bind 127.0.0.1 < /dev/null > $STATE_DIR/snapshot-server.log 2>&1 & echo $! > $STATE_DIR/snapshot-server.pid)
  for i in $(seq 20); do curl -sf -o /dev/null "${SNAPSHOT_URL}digital-objects/catalog.ttl" && break; sleep 0.5; done
  echo "Serving $SNAPSHOT_DIR on $SNAPSHOT_URL"
}

build() {
  local worktree=$STATE_DIR/baseline-src
  rm -rf $worktree && git -C $ROOT worktree prune
  git -C $ROOT worktree add --detach $worktree $BASELINE_REF
  echo "Building $BASELINE_IMAGE from $BASELINE_REF ($(git -C $worktree rev-parse --short HEAD))"
  /usr/bin/time -f "baseline build: %e s" docker build --network host --build-arg CDN_URL=${SNAPSHOT_URL}digital-objects/ \
    -t $BASELINE_IMAGE $worktree 2>&1 | tee $STATE_DIR/baseline-build.log | tail -3
  git -C $ROOT worktree remove --force $worktree

  echo "Building $CANDIDATE_IMAGE from the working tree"
  /usr/bin/time -f "candidate build: %e s" docker build --network host --build-arg CDN_URL=${SNAPSHOT_URL}digital-objects/ \
    -t $CANDIDATE_IMAGE $ROOT 2>&1 | tee $STATE_DIR/candidate-build.log | tail -3
  docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep -E "^($BASELINE_IMAGE|$CANDIDATE_IMAGE) "
}

up() {
  docker rm -f hra-compare-a hra-compare-b > /dev/null 2>&1 || true
  docker run -d --name hra-compare-a --network host \
    -e PORT=$A_PORT -e BLAZEGRAPH_PORT=$((A_PORT + 1)) -e FILE_CACHE_DIR=/tmp/no-file-cache $BASELINE_IMAGE > /dev/null
  docker run -d --name hra-compare-b --network host \
    -e PORT=$B_PORT -e QLEVER_PORT=$((B_PORT + 1)) -e SPARQL_UPDATE_TOKEN=$SPARQL_UPDATE_TOKEN \
    -e FILE_CACHE_DIR=/tmp/no-file-cache $CANDIDATE_IMAGE > /dev/null
  for port in $A_PORT $B_PORT; do
    for i in $(seq 180); do curl -sf -o /dev/null http://localhost:$port/v1/consortium-names && break; sleep 1; done
    echo "API on $port is up"
  done
}

capture() {
  (cd $ROOT && npm run build:code > /dev/null)
  nohup node $HERE/sparql-proxy.js --target http://localhost:$((B_PORT + 1))/ --port $((B_PORT + 2)) > $STATE_DIR/proxy.log 2>&1 &
  echo $! > $STATE_DIR/proxy.pid
  (cd $ROOT && PORT=$((B_PORT + 3)) SPARQL_ENDPOINT=http://localhost:$((B_PORT + 2))/ SPARQL_BACKEND=qlever SPARQL_WRITABLE=true \
    SPARQL_UPDATE_TOKEN=$SPARQL_UPDATE_TOKEN FILE_CACHE_DIR=/tmp/no-file-cache nohup node dist/server.js > $STATE_DIR/capture-api.log 2>&1 &
    echo $! > $STATE_DIR/capture-api.pid)
  for i in $(seq 30); do curl -sf -o /dev/null http://localhost:$((B_PORT + 3))/v1/consortium-names && break; sleep 1; done
  echo "Capture API on $((B_PORT + 3)) (queries logged by the proxy on $((B_PORT + 2)))"
  echo "Run: node test/compare/run.js --b http://localhost:$((B_PORT + 3))/ ...; then node test/compare/sparql-compare.js"
}

down() {
  docker rm -f hra-compare-a hra-compare-b > /dev/null 2>&1 || true
  for f in snapshot-server proxy capture-api; do
    [ -f $STATE_DIR/$f.pid ] && kill $(cat $STATE_DIR/$f.pid) 2> /dev/null || true
    rm -f $STATE_DIR/$f.pid
  done
  echo "Stopped"
}

[ $# -eq 0 ] && { sed -n '2,20p' "$0"; exit 1; }
for cmd in "$@"; do
  case $cmd in
    all) snapshot; serve; build; up ;;
    snapshot | serve | build | up | capture | down) $cmd ;;
    *) echo "Unknown command: $cmd"; exit 1 ;;
  esac
done
