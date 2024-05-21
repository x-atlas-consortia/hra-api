#!/usr/bin/env node
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  getAnatomicalSystemsTreeModel,
  getBiomarkerTreeModel,
  getCellTypeTreeModel,
  getOntologyTreeModel,
  getReferenceOrgans,
  getRuiReferenceData,
} from '../dist/operations/v1.js';
import { cacheDir } from '../src/server/environment.js';

const SPARQL_ENDPOINT = process.env.SPARQL_ENDPOINT ?? 'https://sparql.humanatlas.io/blazegraph/namespace/kb/sparql';

async function runAndCache(operation, file) {
  const filePath = resolve(cacheDir(), file);
  const results = JSON.stringify(await operation({}, SPARQL_ENDPOINT), null, 2);
  return writeFile(filePath, results);
}

await Promise.all([
  runAndCache(getAnatomicalSystemsTreeModel, 'anatomical-systems-tree-model.json'),
  runAndCache(getOntologyTreeModel, 'ontology-tree-model.json'),
  runAndCache(getCellTypeTreeModel, 'cell-type-tree-model.json'),
  runAndCache(getBiomarkerTreeModel, 'biomarker-tree-model.json'),
  runAndCache(getReferenceOrgans, 'reference-organs.json'),
  runAndCache(getRuiReferenceData, 'rui-reference-data.json'),
]);
