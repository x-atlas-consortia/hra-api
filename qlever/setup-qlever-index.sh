#!/bin/bash
# Builds the QLever index with the HRA API's default named graphs pre-loaded
# Usage: setup-qlever-index.sh <index directory>
set -ev

CDN_URL=${CDN_URL:-"https://cdn.humanatlas.io/digital-objects/"}

DEFAULT_GRAPHS=$(cat <<END
https://lod.humanatlas.io
https://purl.humanatlas.io/collection/hra
https://purl.humanatlas.io/collection/hra-api
https://purl.humanatlas.io/graph/hra-ccf-patches
https://purl.humanatlas.io/graph/hra-pop
https://purl.humanatlas.io/collection/ds-graphs
https://purl.humanatlas.io/graph/ds-graphs-enrichments
https://purl.humanatlas.io/collection/hra-millitomes
END
);

DB_DIR=$1
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")

# Start with an empty index
rm -rf $DB_DIR
mkdir -p $DB_DIR/input
cp $SCRIPT_DIR/Qleverfile $DB_DIR/Qleverfile
cd $DB_DIR

MULTI_INPUT_JSON=""
i=0
for graph in $DEFAULT_GRAPHS; do
  echo $graph
  input_file="input/graph-${i}.ttl"
  if [[ $graph == https://lod.humanatlas.io ]]; then
    graph_download="${CDN_URL}catalog.ttl"
    curl -sSfL "$graph_download" -o $input_file
  elif [[ $graph == https://purl.humanatlas.io/* ]]; then
    graph_download="${graph/https:\/\/purl.humanatlas.io\//$CDN_URL}/latest/graph.ttl"
    curl -sSfL "$graph_download" -o $input_file
  else
    curl -sSfL -H "Accept: text/turtle" "$graph" -o $input_file
  fi
  MULTI_INPUT_JSON="${MULTI_INPUT_JSON}${MULTI_INPUT_JSON:+, }{\"cmd\": \"cat ${input_file}\", \"format\": \"ttl\", \"graph\": \"${graph}\"}"
  i=$((i+1))
done

qlever index --multi-input-json "[${MULTI_INPUT_JSON}]" --overwrite-existing

# The downloaded input files are no longer needed once the index is built
rm -rf input
