#!/usr/bin/env node
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  getAnatomicalSystemsTreeModel,
  getBiomarkerTreeModel,
  getCellTypeTreeModel,
  getOntologyTreeModel,
  getReferenceOrgans,
  getRuiReferenceData,
} from '../dist/operations/v1.js';
import { cacheDir, sparqlEndpoint } from '../src/server/environment.js';

async function runAndCache(operation, file) {
  const filePath = resolve(cacheDir(), file);
  const results = JSON.stringify(await operation({}, sparqlEndpoint()), null, 2);
  return writeFile(filePath, results);
}

await mkdir(cacheDir(), { recursive: true });
await Promise.all([
  runAndCache(getAnatomicalSystemsTreeModel, 'anatomical-systems-tree-model.json'),
  runAndCache(getOntologyTreeModel, 'ontology-tree-model.json'),
  runAndCache(getCellTypeTreeModel, 'cell-type-tree-model.json'),
  runAndCache(getBiomarkerTreeModel, 'biomarker-tree-model.json'),
  runAndCache(getReferenceOrgans, 'reference-organs.json'),
  runAndCache(getRuiReferenceData, 'rui-reference-data.json'),
]);
