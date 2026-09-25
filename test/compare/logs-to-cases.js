#!/usr/bin/env node
/**
 * Converts CloudFront access logs (exported to parquet) into replayable comparison cases.
 *
 * Usage: node test/compare/logs-to-cases.js <logs.parquet> [--out test/compare/cases/logs.json] [--max-per-route 250]
 *
 * Requires the `duckdb` CLI on the PATH. Requests are deduplicated by their *parsed* meaning (using the same
 * query parsing as the server), so JSON-encoded and plain variants of the same request collapse into one case.
 * Session tokens from the logs are mapped to harness datasets (see datasets.json), since the original request
 * bodies are not in the logs.
 */
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import qs from 'qs';
import { fileURLToPath } from 'url';
import { queryParametersToFilter } from '../../src/library/v1/utils/parse-filter.js';
import { stableStringify } from './lib/normalize.js';

const HERE = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const logsFile = process.argv[2];
if (!logsFile || logsFile.startsWith('--')) {
  console.error('Usage: node test/compare/logs-to-cases.js <logs.parquet> [--out file] [--max-per-route N]');
  process.exit(1);
}
const outFile = resolve(arg('--out', resolve(HERE, 'cases/logs.json')));
const maxPerRoute = Number(arg('--max-per-route', 250));
const datasets = JSON.parse(readFileSync(resolve(HERE, 'datasets.json'), 'utf8'));

// Routes that are served from the triple store (other routes only proxy remote services or serve static pages)
const FILTERED_ROUTES = new Set([
  'v1/aggregate-results',
  'v1/biomarker-term-occurences',
  'v1/biomarker-tree-model',
  'v1/cell-type-term-occurences',
  'v1/cell-type-tree-model',
  'v1/consortium-names',
  'v1/db-status',
  'v1/ds-graph',
  'v1/gtex-rui-locations',
  'v1/gtex/rui_locations.jsonld',
  'v1/hubmap-rui-locations',
  'v1/hubmap/rui_locations.jsonld',
  'v1/ontology-term-occurences',
  'v1/ontology-tree-model',
  'v1/anatomical-systems-tree-model',
  'v1/provider-names',
  'v1/reference-organs',
  'v1/rui-reference-data',
  'v1/scene',
  'v1/technology-names',
  'v1/tissue-blocks',
  'v1/tissue-provider-names',
  'v1/asctb-sheet-config',
  'v1/asctb-omap-sheet-config',
  'v1/ftu-illustrations',
  'kg/do-search',
  'kg/asctb-term-occurences',
]);
// Routes where specific (non-filter) parameters matter
const PARAM_ROUTES = {
  'v1/extraction-site': ['iri'],
  'v1/reference-organ-scene': ['organ-iri', 'token', 'sex'],
  'kg/digital-objects': [],
  'hra-pop/supported-organs': [],
  'hra-pop/supported-reference-organs': [],
  'hra-pop/supported-tools': [],
  'v1/sparql': ['query', 'format'],
};

const tokenToDataset = new Map();
for (const [name, ds] of Object.entries(datasets.datasets)) {
  for (const token of ds.logTokens ?? []) {
    tokenToDataset.set(token, name);
  }
}

function parseQuery(str) {
  const query = qs.parse(str, { allowDots: true });
  for (const key in query) {
    const value = query[key];
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      try {
        query[key] = JSON.parse(value);
      } catch {
        /* Ignore */
      }
    }
  }
  return query;
}

function decodeCloudFront(str) {
  if (!str || str === '-') return '';
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function hash(s) {
  return createHash('md5').update(s).digest('hex');
}

const sql = `
  SELECT cs_method AS method, cs_uri_stem AS stem, cs_uri_query AS query, COUNT(*) AS n
  FROM '${logsFile.replace(/'/g, "''")}'
  WHERE x_host_header = 'apps.humanatlas.io' AND cs_uri_stem LIKE '/api/%'
    AND cs_method IN ('GET', 'HEAD') AND sc_status < 400
  GROUP BY ALL
`;
console.log('Reading logs from', logsFile);
const rows = JSON.parse(execFileSync('duckdb', ['-json', '-c', sql], { maxBuffer: 1024 * 1024 * 1024 }).toString() || '[]');
console.log(rows.length, 'distinct raw requests');

const cases = new Map();
let skipped = 0;
for (const row of rows) {
  const route = row.stem.replace(/^\/api\//, '').replace(/\/$/, '');
  const isFiltered = FILTERED_ROUTES.has(route);
  const params = PARAM_ROUTES[route];
  if (!isFiltered && !params) {
    skipped += row.n;
    continue;
  }

  const rawQuery = decodeCloudFront(row.query);
  const query = parseQuery(rawQuery);
  const filter = queryParametersToFilter(query);
  const logToken = filter.sessionToken ?? (typeof query.token === 'string' && /^[a-f0-9]{32}$/.test(query.token) ? query.token : undefined);
  const dataset = logToken ? tokenToDataset.get(logToken) ?? datasets.defaultDataset : undefined;
  delete filter.sessionToken;

  const meaningful = isFiltered ? { filter } : {};
  for (const p of params ?? []) {
    if (p !== 'token' && query[p] !== undefined) meaningful[p] = query[p];
  }
  const key = `${row.method} ${route} ${dataset ?? ''} ${stableStringify(meaningful)}`;

  let existing = cases.get(key);
  if (!existing) {
    // Replace the log's token with a placeholder that the runner fills with the harness dataset token
    const replayQuery = rawQuery
      .split('&')
      .filter((kv) => kv.length > 0)
      .map((kv) => (kv.split('=')[0] === 'token' && logToken ? `token=__TOKEN__` : kv))
      .join('&');
    existing = {
      id: `logs:${route}:${hash(key).slice(0, 10)}`,
      group: 'logs',
      route,
      method: row.method,
      path: route,
      query: replayQuery,
      dataset,
      weight: 0,
    };
    cases.set(key, existing);
  }
  existing.weight += row.n;
}
console.log(cases.size, 'distinct cases after normalization;', skipped, 'requests skipped (non triple store routes)');

// Cap the number of cases per route: keep the most frequent half, plus a deterministic sample of the rest
const byRoute = new Map();
for (const c of cases.values()) {
  const list = byRoute.get(c.route) ?? [];
  list.push(c);
  byRoute.set(c.route, list);
}
const selected = [];
for (const [route, list] of [...byRoute.entries()].sort()) {
  list.sort((a, b) => b.weight - a.weight || (a.id < b.id ? -1 : 1));
  const top = list.slice(0, Math.ceil(maxPerRoute / 2));
  const rest = list
    .slice(top.length)
    .sort((a, b) => (hash(a.id) < hash(b.id) ? -1 : 1))
    .slice(0, maxPerRoute - top.length);
  const chosen = top.concat(rest);
  const total = list.reduce((acc, c) => acc + c.weight, 0);
  console.log(`  ${route}: ${list.length} distinct (${total} requests), selected ${chosen.length}`);
  selected.push(...chosen);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(selected, null, 1));
console.log('Wrote', selected.length, 'cases to', outFile);
