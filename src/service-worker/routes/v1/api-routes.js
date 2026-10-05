/**
 * Routes that the service worker forwards to the HRA API (API_ENDPOINT) instead of computing them.
 *
 * They do not depend on a filter, so the server answers them from its file cache (see fileCache in
 * src/server/cache-middleware.js). Some of their queries take longer than public SPARQL endpoints allow, e.g., the
 * ontology tree model and the ASCT+B sheet configurations time out on lod.humanatlas.io.
 */
export const API_ROUTES = [
  'reference-organs',
  'ontology-tree-model',
  'cell-type-tree-model',
  'biomarker-tree-model',
  'anatomical-systems-tree-model',
  'rui-reference-data',
  'asctb-omap-sheet-config',
  'asctb-sheet-config',
  'ftu-illustrations',
];
