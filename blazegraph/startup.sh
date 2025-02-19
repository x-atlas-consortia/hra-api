#!/bin/bash

# Run blazegraph forever (unless stopped here)
while true; do /blazegraph/entrypoint.sh && break; done
