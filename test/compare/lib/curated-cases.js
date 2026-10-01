/**
 * Builds the curated comparison cases: every triple store backed route, a matrix of filters for the
 * filtered routes (with and without session tokens), and all request examples from the OpenAPI spec.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import YAML from 'yaml';

const KIDNEY = 'http://purl.obolibrary.org/obo/UBERON_0002113';
const HEART = 'http://purl.obolibrary.org/obo/UBERON_0000948';
const B_CELL = 'http://purl.obolibrary.org/obo/CL_0000236';
const FIBROBLAST = 'http://purl.obolibrary.org/obo/CL_0000057';
const BIOMARKER = 'http://identifiers.org/hgnc/10044';
const KIDNEY_LEFT_FEMALE = 'https://purl.humanatlas.io/ref-organ/kidney-female-left/v1.3#primary';
const HEART_MALE = 'https://purl.humanatlas.io/ref-organ/heart-male/v1.3#primary';

/** Filters applied to each filtered route (query strings in the formats clients actually send) */
export const FILTERS = {
  none: '',
  'sex-female': 'sex=Female',
  'sex-male-age': 'sex=Male&age-range=30,60',
  'age-json': `age=${encodeURIComponent(JSON.stringify({ min: 20, max: 50 }))}`,
  bmi: 'bmi-range=20,30',
  'ontology-kidney': `ontology-terms=${encodeURIComponent(KIDNEY)}`,
  'ontology-multi-json': `ontology-terms=${encodeURIComponent(JSON.stringify([KIDNEY, HEART]))}`,
  'cell-type': `cell-type-terms=${encodeURIComponent(B_CELL)}`,
  'cell-type-multi': `cell-type-terms=${encodeURIComponent(B_CELL)}&cell-type-terms=${encodeURIComponent(FIBROBLAST)}`,
  biomarker: `biomarker-terms=${encodeURIComponent(BIOMARKER)}`,
  consortium: 'consortiums=HuBMAP',
  provider: `providers=${encodeURIComponent(JSON.stringify(['TMC - Pacific Northwest National Laboratory', 'KPMP']))}`,
  technology: `technologies=${encodeURIComponent(JSON.stringify(['CODEX', 'Light Sheet']))}`,
  'spatial-kidney': `spatial=${encodeURIComponent(
    JSON.stringify([{ target: KIDNEY_LEFT_FEMALE, x: 36, y: 62, z: 38, radius: 30 }])
  )}`,
  'spatial-dots': `spatial.target=${encodeURIComponent(HEART_MALE)}&spatial.x=60&spatial.y=50&spatial.z=50&spatial.radius=40`,
  combined: `sex=Female&ontology-terms=${encodeURIComponent(KIDNEY)}&technologies=${encodeURIComponent(
    JSON.stringify(['Light Sheet', 'CODEX', 'Histology'])
  )}&age-range=20,80`,
  // What the EUI sends by default (all JSON encoded, "select everything" terms)
  'eui-default': [
    `ontology-terms=${encodeURIComponent(JSON.stringify(['http://purl.obolibrary.org/obo/UBERON_0013702']))}`,
    `cell-type-terms=${encodeURIComponent(JSON.stringify(['http://purl.obolibrary.org/obo/CL_0000000']))}`,
    `biomarker-terms=${encodeURIComponent(JSON.stringify(['http://purl.org/ccf/biomarkers']))}`,
    'consortiums=%5B%5D&providers=%5B%5D&sex=%22both%22&spatial=%5B%5D&technologies=%5B%5D',
  ].join('&'),
  'no-match': `ontology-terms=${encodeURIComponent('http://purl.obolibrary.org/obo/UBERON_9999999')}`,
};

/** Routes whose results depend on the filter */
export const FILTERED_ROUTES = [
  'v1/tissue-blocks',
  'v1/aggregate-results',
  'v1/ontology-term-occurences',
  'v1/cell-type-term-occurences',
  'v1/biomarker-term-occurences',
  'v1/scene',
  'v1/ds-graph',
  'v1/hubmap-rui-locations',
  'v1/gtex-rui-locations',
];

/** Routes that ignore filters (still checked with and without a token where relevant) */
export const STATIC_ROUTES = [
  'v1/consortium-names',
  'v1/technology-names',
  'v1/provider-names',
  'v1/tissue-provider-names',
  'v1/reference-organs',
  'v1/ontology-tree-model',
  'v1/cell-type-tree-model',
  'v1/biomarker-tree-model',
  'v1/anatomical-systems-tree-model',
  'v1/rui-reference-data',
  'v1/ftu-illustrations',
  'v1/asctb-sheet-config',
  'v1/asctb-omap-sheet-config',
  'v1/hubmap/rui_locations.jsonld',
  'v1/gtex/rui_locations.jsonld',
  'hra-pop/supported-organs',
  'hra-pop/supported-reference-organs',
  'hra-pop/supported-tools',
];

/** Routes that should be checked against each session-token dataset */
const TOKEN_ROUTES = [
  'v1/tissue-blocks',
  'v1/aggregate-results',
  'v1/ontology-term-occurences',
  'v1/cell-type-term-occurences',
  'v1/biomarker-term-occurences',
  'v1/scene',
  'v1/ds-graph',
  'v1/consortium-names',
  'v1/technology-names',
  'v1/provider-names',
];

const TOKEN_FILTERS = ['none', 'sex-female', 'ontology-kidney', 'spatial-kidney', 'combined', 'eui-default'];

const REFERENCE_ORGANS = [
  KIDNEY_LEFT_FEMALE,
  HEART_MALE,
  'https://purl.humanatlas.io/ref-organ/brain-female/v1.4#primary',
  'https://purl.humanatlas.io/ref-organ/does-not-exist/v1.0#primary',
];

function joinQuery(...parts) {
  return parts.filter((p) => p && p.length > 0).join('&');
}

/** Extracts request examples for every operation in the bundled OpenAPI spec */
function specCases(specFile) {
  const spec = YAML.parse(readFileSync(specFile, 'utf8'));
  const cases = [];
  const resolveRef = (obj) => {
    let current = obj;
    while (current?.$ref) {
      current = current.$ref
        .replace(/^#\//, '')
        .split('/')
        .reduce((acc, key) => acc?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], spec);
    }
    return current;
  };

  for (const [path, ops] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(ops)) {
      if (!['get', 'post'].includes(method)) continue;
      const route = path.replace(/^\//, '');
      const params = (op.parameters ?? []).map(resolveRef).filter((p) => p?.in === 'query');
      const examples = params.filter((p) => p.example !== undefined || p.schema?.example !== undefined);
      if (method === 'get' && examples.length > 0) {
        const query = examples
          .map((p) => {
            const value = p.example ?? p.schema.example;
            const str = typeof value === 'string' ? value : JSON.stringify(value);
            return `${encodeURIComponent(p.name)}=${encodeURIComponent(str)}`;
          })
          .join('&');
        cases.push({ id: `spec:GET:${route}`, group: 'spec', route, method: 'GET', path: route, query });
      }
      const body = resolveRef(op.requestBody);
      const example = body?.content?.['application/json']?.example;
      if (method === 'post' && example !== undefined) {
        cases.push({ id: `spec:POST:${route}`, group: 'spec', route, method: 'POST', path: route, body: example });
      }
    }
  }
  return cases;
}

/**
 * @param {object} options
 * @param {string} options.specFile - path to the bundled OpenAPI spec (hra-api-spec.yaml)
 * @param {string[]} options.datasets - names of the session-token datasets available
 */
export function curatedCases({ specFile, datasets }) {
  const cases = [];
  const add = (c) => cases.push({ group: 'curated', method: 'GET', ...c });

  for (const route of STATIC_ROUTES) {
    add({ id: `curated:${route}`, route, path: route, query: '', tags: ['perf'] });
  }
  for (const route of FILTERED_ROUTES) {
    for (const [name, query] of Object.entries(FILTERS)) {
      add({
        id: `curated:${route}:${name}`,
        route,
        path: route,
        query,
        tags: ['none', 'combined', 'spatial-kidney', 'eui-default'].includes(name) ? ['perf'] : [],
      });
    }
  }
  for (const dataset of datasets) {
    add({ id: `curated:v1/db-status:${dataset}`, route: 'v1/db-status', path: 'v1/db-status', query: 'token=__TOKEN__', dataset });
    for (const route of TOKEN_ROUTES) {
      for (const name of TOKEN_FILTERS) {
        add({
          id: `curated:${route}:${name}:token:${dataset}`,
          route,
          path: route,
          query: joinQuery(FILTERS[name], 'token=__TOKEN__'),
          dataset,
          tags: dataset === 'hubmap' && ['none', 'eui-default'].includes(name) ? ['perf'] : [],
        });
      }
    }
  }
  for (const organ of REFERENCE_ORGANS) {
    const route = 'v1/reference-organ-scene';
    add({ id: `curated:${route}:${organ}`, route, path: route, query: `organ-iri=${encodeURIComponent(organ)}`, tags: ['perf'] });
    add({
      id: `curated:${route}:${organ}:female`,
      route,
      path: route,
      query: `organ-iri=${encodeURIComponent(organ)}&sex=Female`,
    });
    add({
      id: `curated:${route}:${organ}:token:hubmap`,
      route,
      path: route,
      query: `organ-iri=${encodeURIComponent(organ)}&token=__TOKEN__`,
      dataset: 'hubmap',
    });
  }
  add({ id: 'curated:v1/extraction-site:missing-iri', route: 'v1/extraction-site', path: 'v1/extraction-site', query: '' });
  add({
    id: 'curated:v1/extraction-site:unknown',
    route: 'v1/extraction-site',
    path: 'v1/extraction-site',
    query: `iri=${encodeURIComponent('http://purl.org/ccf/1.5/00000000-0000-0000-0000-000000000000')}`,
  });
  add({ id: 'curated:v1/db-status:no-token', route: 'v1/db-status', path: 'v1/db-status', query: '' });

  return cases.concat(specCases(resolve(specFile)));
}
