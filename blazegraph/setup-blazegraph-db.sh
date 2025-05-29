#!/bin/bash
set -ev

CDN_URL=${CDN_URL:-"https://cdn.humanatlas.io/digital-objects/"}

DEFAULT_GRAPHS=$(cat <<END
https://lod.humanatlas.io
https://purl.humanatlas.io/collection/hra-api
https://purl.humanatlas.io/collection/hra
https://purl.humanatlas.io/graph/hra-ccf-patches
https://purl.humanatlas.io/graph/hra-pop
https://purl.humanatlas.io/collection/ds-graphs
https://purl.humanatlas.io/graph/ds-graphs-enrichments
https://purl.humanatlas.io/collection/hra-millitomes
END
);

DB=$1

rm -f $DB # Start with an empty database

TMP_GRAPH=$(tempfile -p graph -s .ttl)
for graph in $DEFAULT_GRAPHS; do
  echo $graph
  if [[ $graph == https://lod.humanatlas.io ]]; then
    graph_download="${CDN_URL}catalog.ttl"
    curl "$graph_download" -o $TMP_GRAPH
  elif [[ $graph == https://purl.humanatlas.io/* ]]; then
    graph_download="${graph/https:\/\/purl.humanatlas.io\//$CDN_URL}/latest/graph.ttl"
    curl "$graph_download" -o $TMP_GRAPH
  else
    curl -H "Accept: text/turtle" "$graph" -o $TMP_GRAPH
  fi
  blazegraph-runner "--journal=${DB}" load "--graph=$graph" $TMP_GRAPH
done

rm -f $TMP_GRAPH
