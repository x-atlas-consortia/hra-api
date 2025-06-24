#!/usr/bin/env node
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { getDigitalObjects } from '../dist/operations/hra-kg.js';
import {
  getAnatomicalSystemsTreeModel,
  getASCTBOmapSheetConfig,
  getASCTBSheetConfig,
  getBiomarkerTreeModel,
  getCellTypeTreeModel,
  getFtuIllustrations,
  getOntologyTreeModel,
  getReferenceOrgans,
  getRuiReferenceData,
} from '../dist/operations/v1.js';
import { cacheDir, sparqlEndpoint } from '../src/server/environment.js';

function runAndCache(operation, file, emptyFirstArg = true) {
  return async () => {
    const filePath = resolve(cacheDir(), file);
    let data;
    if (emptyFirstArg) {
      data = await operation({}, sparqlEndpoint());
    } else {
      data = await operation(sparqlEndpoint());
    }
    const results = JSON.stringify(data, null, 2);
    return writeFile(filePath, results);
  };
}

await mkdir(cacheDir(), { recursive: true });
const requests = [
  runAndCache(getAnatomicalSystemsTreeModel, 'anatomical-systems-tree-model.json'),
  runAndCache(getOntologyTreeModel, 'ontology-tree-model.json'),
  runAndCache(getCellTypeTreeModel, 'cell-type-tree-model.json'),
  runAndCache(getBiomarkerTreeModel, 'biomarker-tree-model.json'),
  runAndCache(getReferenceOrgans, 'reference-organs.json'),
  runAndCache(getRuiReferenceData, 'rui-reference-data.json'),
  runAndCache(getASCTBOmapSheetConfig, 'asctb-omap-sheet-config.json'),
  runAndCache(getASCTBSheetConfig, 'asctb-sheet-config.json'),
  runAndCache(getFtuIllustrations, 'ftu-illustrations.json'),
  runAndCache(getDigitalObjects, 'digital-objects.json', false),
];
for (const request of requests) {
  await request();
}
