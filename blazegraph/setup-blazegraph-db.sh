#!/bin/bash
set -ev

DEFAULT_GRAPHS=$(cat <<END
https://purl.humanatlas.io/collection/hra-api
https://purl.humanatlas.io/graph/hra-ccf-patches
https://purl.humanatlas.io/graph/hra-pop
https://purl.humanatlas.io/collection/ds-graphs
https://purl.humanatlas.io/graph/ds-graphs-enrichments
END
);

DB=$1

rm -f $DB # Start with an empty database

TMP_GRAPH=$(tempfile -p graph -s .ttl)
for graph in $DEFAULT_GRAPHS; do
  echo $graph
  curl -H "Accept: text/turtle" "$graph" -o $TMP_GRAPH
  blazegraph-runner "--journal=${DB}" load "--graph=$graph" $TMP_GRAPH
done

rm -f $TMP_GRAPH
