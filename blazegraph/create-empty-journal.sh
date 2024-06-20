#!/bin/bash

rm -f blazegraph/empty-blazegraph.jnl*

echo "" > empty.ttl && blazegraph-runner --journal=blazegraph/empty-blazegraph.jnl load empty.ttl && rm -f empty.ttl

gzip blazegraph/empty-blazegraph.jnl
