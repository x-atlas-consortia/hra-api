#!/bin/bash
set -ev

DEFAULT_GRAPHS="https://purl.humanatlas.io/collection/hra-api https://purl.humanatlas.io/graph/hra-ccf-patches https://purl.humanatlas.io/graph/hra-pop https://purl.humanatlas.io/collection/ds-graphs https://purl.humanatlas.io/graph/ds-graphs-enrichments"

DB=$1

TMP_GRAPH=$(tempfile -s .ttl)
for graph in $DEFAULT_GRAPHS; do
  echo $graph
  curl -H "Accept: text/turtle" "$graph" -o $TMP_GRAPH
  blazegraph-runner "--journal=${DB}" load "--graph=$graph" $TMP_GRAPH
done

rm -f $TMP_GRAPH
