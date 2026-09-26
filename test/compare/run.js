#!/usr/bin/env node
/**
 * Blazegraph vs. QLever comparison harness for the HRA API.
 *
 * Sends the same requests to two running HRA API instances (A = baseline, B = candidate), compares the responses
 * (correctness), and optionally measures latency (performance). See test/compare/README.md.
 *
 * Usage: node test/compare/run.js [options]
 *   --a <url>              Baseline API (default http://localhost:18080/)
 *   --b <url>              Candidate API (default http://localhost:28080/)
 *   --b-sparql <url>       Candidate QLever endpoint, used to clear its cache in uncached perf mode
 *                          (default http://localhost:28081/)
 *   --b-token <token>      QLever access token (default $SPARQL_UPDATE_TOKEN or harness-secret)
 *   --snapshot <url>       Snapshot server with the data sources used for session tokens
 *                          (default http://localhost:18900/)
 *   --snapshot-dir <dir>   Local snapshot directory (for inline data sources)
 *   --cases <list>         Comma separated case sets: curated,logs (default curated,logs)
 *   --grep <regex>         Only run cases whose id matches
 *   --limit <n>            Only run the first n cases
 *   --concurrency <n>      Number of cases compared in parallel (default 4)
 *   --reuse-datasets       Reuse session-token datasets from previous runs (skips the pipeline timing)
 *   --skip-correctness     Only run the performance tests
 *   --perf                 Run the performance tests
 *   --perf-runs <n>        Timed runs per case and backend (default 10)
 *   --perf-warmup <n>      Warm up runs per case and backend (default 2)
 *   --perf-budget <s>      Max seconds per case and backend before stopping early (default 90)
 *   --perf-top <n>         Most frequent log cases per route to include in the perf tests (default 3)
 *   --perf-modes <list>    uncached,warm (default uncached,warm)
 *   --load-concurrency <n> Concurrency of the load test (default 8, 0 to skip)
 *   --out <dir>            Report directory (default test/compare/report)
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { compareResponses, NON_FAILING, PASSING } from './lib/compare.js';
import { curatedCases } from './lib/curated-cases.js';
import { mapLimit, sendCase } from './lib/http.js';
import { writeReport } from './lib/report.js';
import { geomean, summarize } from './lib/stats.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
function flag(name) {
  return process.argv.includes(name);
}
function withSlash(url) {
  return url.endsWith('/') ? url : url + '/';
}

const opts = {
  a: withSlash(arg('--a', 'http://localhost:18080/')),
  b: withSlash(arg('--b', 'http://localhost:28080/')),
  bSparql: withSlash(arg('--b-sparql', 'http://localhost:28081/')),
  bToken: arg('--b-token', process.env.SPARQL_UPDATE_TOKEN ?? 'harness-secret'),
  snapshot: withSlash(arg('--snapshot', 'http://localhost:18900/')),
  snapshotDir: arg('--snapshot-dir', resolve(HERE, '.snapshot')),
  cases: arg('--cases', 'curated,logs').split(','),
  grep: arg('--grep') ? new RegExp(arg('--grep')) : undefined,
  limit: Number(arg('--limit', Infinity)),
  concurrency: Number(arg('--concurrency', 4)),
  reuseDatasets: flag('--reuse-datasets'),
  skipCorrectness: flag('--skip-correctness'),
  perf: flag('--perf'),
  perfRuns: Number(arg('--perf-runs', 10)),
  perfWarmup: Number(arg('--perf-warmup', 2)),
  perfBudgetMs: Number(arg('--perf-budget', 90)) * 1000,
  perfTop: Number(arg('--perf-top', 3)),
  perfModes: arg('--perf-modes', 'uncached,warm').split(','),
  loadConcurrency: Number(arg('--load-concurrency', 8)),
  out: resolve(arg('--out', resolve(HERE, 'report'))),
};

// Performance gate (see the migration plan): p95 within 1.2x of the baseline (cases faster than 50ms are exempt)
// and the geometric mean of the p50 ratios must not be worse
const PERF_RATIO_LIMIT = 1.2;
const PERF_MIN_MS = 50;

// Values that differ on every call by design (per route)
const VOLATILE = {
  // Composed placements get a random @id and today's date (see SpatialGraph.matrixToSpatialPlacement)
  'v1/rui-reference-data': [/^placementPatches\..+\.(@id|placement_date)$/],
  // Load times and timestamps of session-token datasets
  'v1/db-status': [/^(loadTime|startTime|timestamp)$/],
};

const BACKENDS = { a: opts.a, b: opts.b };
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve(opts.out, runId);
// Results are also appended here as they come in, so that interrupted runs can be inspected
const progressFile = resolve(outDir, 'progress.jsonl');

function log(...args) {
  console.log(new Date().toISOString().slice(11, 19), ...args);
}

// ---------------------------------------------------------------------------------------------------------------
// Session-token datasets
// ---------------------------------------------------------------------------------------------------------------

function datasetRequest(dataset) {
  const dataSources = (dataset.dataSources ?? []).map((s) => s.replace('${SNAPSHOT}', opts.snapshot));
  for (const file of dataset.inlineDataSources ?? []) {
    dataSources.push(JSON.parse(readFileSync(resolve(opts.snapshotDir, file), 'utf8')));
  }
  const request = { dataSources };
  if (!opts.reuseDatasets) {
    // The filter is not used when building the dataset, but makes the token (md5 of the request) unique per run
    request.filter = { harnessRun: runId };
  }
  return request;
}

async function createDataset(base, name, request, expectStatus) {
  const start = performance.now();
  const resp = await fetch(new URL('v1/session-token', base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const { token } = await resp.json();
  if (!token) {
    throw new Error(`${base}: no session token returned for dataset ${name} (is the database writable?)`);
  }
  let info;
  for (;;) {
    info = await (await fetch(new URL(`v1/db-status?token=${token}`, base))).json();
    if (info.status === 'Ready' || info.status === 'Error') break;
    if (performance.now() - start > 60 * 60 * 1000) throw new Error(`Timed out creating dataset ${name}`);
    await new Promise((r) => setTimeout(r, 250));
  }
  const ms = performance.now() - start;
  const ok = info.status === (expectStatus ?? 'Ready');
  log(`  ${name} @ ${base}: ${info.status} in ${(ms / 1000).toFixed(1)}s${ok ? '' : ' (UNEXPECTED)'}`);
  return { token, status: info.status, message: info.message, ms, ok };
}

async function setupDatasets() {
  const config = JSON.parse(readFileSync(resolve(HERE, 'datasets.json'), 'utf8'));
  const tokens = {};
  const results = [];
  log('Creating session-token datasets');
  for (const [name, dataset] of Object.entries(config.datasets)) {
    const request = datasetRequest(dataset);
    // Sequentially, so that the pipeline timings do not interfere with each other
    const a = await createDataset(opts.a, name, request, dataset.expectStatus);
    const b = await createDataset(opts.b, name, request, dataset.expectStatus);
    if (a.token !== b.token) {
      throw new Error(`Dataset ${name}: tokens differ between backends (${a.token} vs ${b.token})`);
    }
    tokens[name] = a.token;
    results.push({ name, token: a.token, a, b, ok: a.ok && b.ok && a.status === b.status });
  }
  return { tokens, results, defaultDataset: config.defaultDataset };
}

// ---------------------------------------------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------------------------------------------

function loadCases(datasetNames) {
  let cases = [];
  if (opts.cases.includes('curated')) {
    const specFile = resolve(ROOT, 'hra-api-spec.yaml');
    cases.push(...curatedCases({ specFile, datasets: datasetNames }));
  }
  if (opts.cases.includes('logs')) {
    const logsFile = resolve(HERE, 'cases/logs.json');
    if (existsSync(logsFile)) {
      cases.push(...JSON.parse(readFileSync(logsFile, 'utf8')));
    } else {
      log('No log cases found (run logs-to-cases.js first):', logsFile);
    }
  }
  if (opts.grep) {
    cases = cases.filter((c) => opts.grep.test(c.id));
  }
  const seen = new Set();
  cases = cases.filter((c) => !seen.has(c.id) && seen.add(c.id));
  return cases.slice(0, opts.limit);
}

function bindCase(testCase, tokens, defaultDataset) {
  if (!testCase.query?.includes('__TOKEN__')) {
    return testCase;
  }
  const token = tokens[testCase.dataset] ?? tokens[defaultDataset];
  return { ...testCase, query: testCase.query.replace('__TOKEN__', token) };
}

function loadAllowlist() {
  const file = resolve(HERE, 'allowlist.json');
  const entries = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).entries ?? [] : [];
  return entries.map((e) => ({ ...e, regex: new RegExp(e.pattern) }));
}

// ---------------------------------------------------------------------------------------------------------------
// Correctness
// ---------------------------------------------------------------------------------------------------------------

async function runCorrectness(cases, tokens, defaultDataset) {
  const allowlist = loadAllowlist();
  log(`Comparing ${cases.length} cases (concurrency ${opts.concurrency})`);
  let done = 0;
  return mapLimit(cases, opts.concurrency, async (testCase) => {
    const bound = bindCase(testCase, tokens, defaultDataset);
    const [ra, rb] = await Promise.all([sendCase(opts.a, bound), sendCase(opts.b, bound)]);
    const { category, details } = compareResponses(ra, rb, { volatile: VOLATILE[testCase.route] });
    const allowed = PASSING.has(category) || NON_FAILING.has(category)
      ? undefined
      : allowlist.find((e) => e.regex.test(testCase.id) && (!e.category || e.category === category));
    done++;
    if (done % 100 === 0 || done === cases.length) {
      log(`  ${done}/${cases.length}`);
    }
    const result = {
      id: testCase.id,
      group: testCase.group,
      route: testCase.route,
      method: testCase.method,
      query: testCase.query,
      dataset: testCase.dataset,
      weight: testCase.weight,
      category,
      reviewed: allowed ? { reason: allowed.reason, type: allowed.type } : undefined,
      details,
      status: [ra.status, rb.status],
      bytes: [ra.bytes, rb.bytes],
      ms: [ra.ms, rb.ms],
    };
    appendFileSync(progressFile, JSON.stringify(result) + '\n');
    return result;
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------------------------------------------

async function clearQleverCache() {
  const url = new URL(opts.bSparql);
  url.searchParams.set('cmd', 'clear-cache-complete');
  url.searchParams.set('access-token', opts.bToken);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Could not clear the QLever cache: ${resp.status} ${await resp.text()}`);
  }
}

function selectPerfCases(cases) {
  const selected = cases.filter((c) => c.tags?.includes('perf'));
  const byRoute = new Map();
  for (const c of cases.filter((c) => c.group === 'logs')) {
    byRoute.set(c.route, (byRoute.get(c.route) ?? []).concat(c));
  }
  for (const list of byRoute.values()) {
    selected.push(...list.sort((a, b) => b.weight - a.weight).slice(0, opts.perfTop));
  }
  return selected;
}

async function timeCase(testCase, mode) {
  const timings = { a: [], b: [] };
  const spent = { a: 0, b: 0 };
  const errors = { a: 0, b: 0 };
  const total = opts.perfWarmup + opts.perfRuns;
  for (let i = 0; i < total; i++) {
    // Alternate the order of the backends to cancel out drift
    const order = i % 2 === 0 ? ['a', 'b'] : ['b', 'a'];
    for (const key of order) {
      if (i >= opts.perfWarmup + 3 && spent[key] > opts.perfBudgetMs) continue;
      if (mode === 'uncached' && key === 'b') {
        await clearQleverCache();
      }
      const r = await sendCase(BACKENDS[key], testCase);
      if (r.error || r.status >= 500) errors[key]++;
      if (i >= opts.perfWarmup) {
        timings[key].push(r.ms);
        spent[key] += r.ms;
      }
    }
  }
  const a = summarize(timings.a);
  const b = summarize(timings.b);
  const p95Ratio = b.p95 / a.p95;
  const exempt = Math.max(a.p95, b.p95) < PERF_MIN_MS;
  return {
    id: testCase.id,
    route: testCase.route,
    mode,
    a,
    b,
    p50Ratio: b.p50 / a.p50,
    p95Ratio,
    errors,
    pass: exempt || p95Ratio <= PERF_RATIO_LIMIT,
    exempt,
  };
}

async function runLoad(cases) {
  const results = {};
  for (const key of ['a', 'b']) {
    log(`  Load test on ${key} (${cases.length} requests x 3, concurrency ${opts.loadConcurrency})`);
    const list = [...cases, ...cases, ...cases];
    const start = performance.now();
    const timings = await mapLimit(list, opts.loadConcurrency, async (c) => (await sendCase(BACKENDS[key], c)).ms);
    results[key] = { wallMs: performance.now() - start, latency: summarize(timings) };
  }
  return results;
}

async function runPerf(cases, tokens, defaultDataset) {
  const perfCases = selectPerfCases(cases).map((c) => bindCase(c, tokens, defaultDataset));
  const results = [];
  for (const mode of opts.perfModes) {
    log(`Timing ${perfCases.length} cases (${mode}, ${opts.perfWarmup} warmup + ${opts.perfRuns} runs)`);
    for (const [i, c] of perfCases.entries()) {
      const r = await timeCase(c, mode);
      results.push(r);
      appendFileSync(progressFile, JSON.stringify({ perf: r }) + '\n');
      log(
        `  [${i + 1}/${perfCases.length}] ${c.id}: A p50 ${r.a.p50.toFixed(0)}ms p95 ${r.a.p95.toFixed(0)}ms | ` +
          `B p50 ${r.b.p50.toFixed(0)}ms p95 ${r.b.p95.toFixed(0)}ms | p95 ratio ${r.p95Ratio.toFixed(2)}${r.pass ? '' : ' FAIL'}`
      );
    }
  }
  const summaryByMode = {};
  for (const mode of opts.perfModes) {
    const list = results.filter((r) => r.mode === mode);
    summaryByMode[mode] = {
      cases: list.length,
      failures: list.filter((r) => !r.pass).length,
      geomeanP50Ratio: geomean(list.map((r) => r.p50Ratio)),
      geomeanP95Ratio: geomean(list.map((r) => r.p95Ratio)),
    };
  }
  let load;
  if (opts.loadConcurrency > 0) {
    log('Load test');
    load = await runLoad(perfCases);
  }
  return { cases: results, summaryByMode, load, limits: { ratio: PERF_RATIO_LIMIT, minMs: PERF_MIN_MS } };
}

// ---------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------

async function main() {
  mkdirSync(outDir, { recursive: true });
  log('Baseline (A):', opts.a, ' Candidate (B):', opts.b, ' Output:', outDir);
  const datasets = await setupDatasets();
  const cases = loadCases(Object.keys(datasets.tokens));

  const correctness = opts.skipCorrectness ? [] : await runCorrectness(cases, datasets.tokens, datasets.defaultDataset);
  const perf = opts.perf ? await runPerf(cases, datasets.tokens, datasets.defaultDataset) : undefined;

  const results = { runId, options: { ...opts, grep: opts.grep?.source }, datasets: datasets.results, correctness, perf };
  writeFileSync(resolve(outDir, 'results.json'), JSON.stringify(results, null, 1));
  const { summary, failed } = writeReport(results, outDir);
  writeFileSync(resolve(opts.out, 'latest.txt'), outDir + '\n');
  console.log('\n' + summary);
  log('Report written to', outDir);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
