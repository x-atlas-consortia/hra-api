#!/usr/bin/env node
/**
 * Load test for a single HRA API instance, with per-route latencies.
 *
 * Replays a fixed, shuffled request mix with a number of concurrent clients (closed loop), so that different
 * server configurations (e.g., API_INSTANCES and ACTIVE_QUERIES) can be compared on the same requests.
 *
 * Usage: node test/compare/load.js --target <url> [options]
 *   --target <url>        API to test (required)
 *   --mix <name>          harness: the perf cases (curated perf cases + most frequent log cases per route)
 *                         production: log cases sampled by production CloudFront miss volume per route (--weights)
 *   --weights <csv>       CSV with route,miss_n columns (for --mix production)
 *   --requests <n>        Number of requests (production mix; the harness mix sends each case --repeat times)
 *   --repeat <n>          Times each harness case is sent (default 3)
 *   --concurrency <n>     Concurrent clients (default 8)
 *   --seed <n>            Shuffle/sampling seed (default 1), use the same seed to compare configurations
 *   --snapshot <url>      Snapshot server with the session-token data sources (default http://localhost:18900/)
 *   --label <text>        Label for the output
 *   --out <file>          Write the results (JSON) to this file
 *   --dry-run             Only print the number of requests per route
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { curatedCases } from './lib/curated-cases.js';
import { mapLimit, sendCase } from './lib/http.js';
import { summarize } from './lib/stats.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const opts = {
  target: arg('--target'),
  mix: arg('--mix', 'harness'),
  weights: arg('--weights'),
  requests: Number(arg('--requests', 600)),
  repeat: Number(arg('--repeat', 3)),
  concurrency: Number(arg('--concurrency', 8)),
  seed: Number(arg('--seed', 1)),
  snapshot: arg('--snapshot', 'http://localhost:18900/'),
  snapshotDir: resolve(HERE, '.snapshot'),
  label: arg('--label', ''),
  out: arg('--out'),
  perfTop: 3,
};
if (!opts.target) {
  console.error('Usage: node test/compare/load.js --target <url> [options]');
  process.exit(1);
}

function log(...args) {
  console.log(new Date().toISOString().slice(11, 19), ...args);
}

// Deterministic PRNG (mulberry32), so that every configuration gets the same requests in the same order
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickWeighted(list, random) {
  const total = list.reduce((a, c) => a + c.weight, 0);
  let r = random() * total;
  for (const c of list) {
    r -= c.weight;
    if (r <= 0) return c;
  }
  return list[list.length - 1];
}

// Session-token datasets (without a per-run filter, so that every configuration uses the same tokens)
async function createDataset(name, dataset) {
  const dataSources = (dataset.dataSources ?? []).map((s) => s.replace('${SNAPSHOT}', opts.snapshot));
  for (const file of dataset.inlineDataSources ?? []) {
    dataSources.push(JSON.parse(readFileSync(resolve(opts.snapshotDir, file), 'utf8')));
  }
  const start = performance.now();
  const resp = await fetch(new URL('v1/session-token', opts.target), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataSources }),
  });
  const { token } = await resp.json();
  for (;;) {
    const info = await (await fetch(new URL(`v1/db-status?token=${token}`, opts.target))).json();
    if (info.status === 'Ready' || info.status === 'Error') {
      log(`  ${name}: ${info.status} in ${((performance.now() - start) / 1000).toFixed(1)}s`);
      return token;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

function bindCase(testCase, tokens, defaultDataset) {
  if (!testCase.query?.includes('__TOKEN__')) return testCase;
  const token = tokens[testCase.dataset] ?? tokens[defaultDataset];
  return { ...testCase, query: testCase.query.replace('__TOKEN__', token) };
}

function selectRequests(datasetNames) {
  const random = rng(opts.seed);
  const logs = JSON.parse(readFileSync(resolve(HERE, 'cases/logs.json'), 'utf8')).filter((c) => c.method === 'GET');
  const byRoute = new Map();
  for (const c of logs) byRoute.set(c.route, (byRoute.get(c.route) ?? []).concat(c));

  if (opts.mix === 'harness') {
    const curated = curatedCases({ specFile: resolve(ROOT, 'hra-api-spec.yaml'), datasets: datasetNames });
    const cases = curated.filter((c) => c.tags?.includes('perf'));
    for (const list of byRoute.values()) {
      cases.push(...[...list].sort((a, b) => b.weight - a.weight).slice(0, opts.perfTop));
    }
    return shuffle(Array.from({ length: opts.repeat }, () => cases).flat(), random);
  }

  if (opts.mix === 'production') {
    const [header, ...rows] = readFileSync(opts.weights, 'utf8').trim().split('\n');
    const cols = header.split(',');
    const misses = rows
      .map((line) => Object.fromEntries(line.split(',').map((v, i) => [cols[i], v])))
      .map((r) => ({ route: r.route, n: Number(r.miss_n) }))
      .filter((r) => r.n > 0 && byRoute.has(r.route));
    const total = misses.reduce((a, r) => a + r.n, 0);
    const requests = [];
    for (const { route, n } of misses) {
      const count = Math.max(1, Math.round((opts.requests * n) / total));
      for (let i = 0; i < count; i++) requests.push(pickWeighted(byRoute.get(route), random));
    }
    return shuffle(requests, random);
  }

  throw new Error(`Unknown mix: ${opts.mix}`);
}

async function main() {
  const config = JSON.parse(readFileSync(resolve(HERE, 'datasets.json'), 'utf8'));
  const datasetNames = Object.keys(config.datasets).filter((n) => !config.datasets[n].expectStatus);
  let requests = selectRequests(datasetNames);
  if (process.argv.includes('--dry-run')) {
    const counts = {};
    for (const c of requests) counts[c.route] = (counts[c.route] ?? 0) + 1;
    console.log(requests.length, 'requests', counts);
    return;
  }

  log(`Target ${opts.target} (${opts.label || 'no label'}): creating session-token datasets`);
  const tokens = {};
  const needed = new Set([config.defaultDataset, ...requests.map((c) => c.dataset).filter(Boolean)]);
  for (const name of datasetNames.filter((n) => needed.has(n))) {
    tokens[name] = await createDataset(name, config.datasets[name]);
  }
  requests = requests.map((c) => bindCase(c, tokens, config.defaultDataset));

  log(`Sending ${requests.length} requests (${opts.mix} mix, concurrency ${opts.concurrency}, seed ${opts.seed})`);
  const t0 = performance.now();
  let done = 0;
  const results = await mapLimit(requests, opts.concurrency, async (c) => {
    const startMs = performance.now() - t0;
    const r = await sendCase(opts.target, c);
    if (++done % 50 === 0) log(`  ${done}/${requests.length}`);
    return { id: c.id, route: c.route, startMs, ms: r.ms, status: r.status, error: r.error, bytes: r.bytes };
  });
  const wallMs = performance.now() - t0;

  const failed = (r) => r.error || r.status >= 500;
  const routes = {};
  for (const r of results) (routes[r.route] ??= []).push(r);
  const summary = {
    label: opts.label,
    mix: opts.mix,
    concurrency: opts.concurrency,
    seed: opts.seed,
    requests: results.length,
    errors: results.filter(failed).length,
    wallMs,
    throughputPerMin: (results.length / wallMs) * 60000,
    latency: summarize(results.map((r) => r.ms)),
    routes: Object.fromEntries(
      Object.entries(routes).map(([route, list]) => [
        route,
        { ...summarize(list.map((r) => r.ms)), errors: list.filter(failed).length },
      ])
    ),
  };
  log(
    `Done in ${(wallMs / 1000).toFixed(1)}s: ${summary.throughputPerMin.toFixed(1)} req/min, ` +
      `p50 ${(summary.latency.p50 / 1000).toFixed(2)}s, p95 ${(summary.latency.p95 / 1000).toFixed(2)}s, ` +
      `max ${(summary.latency.max / 1000).toFixed(2)}s, errors ${summary.errors}`
  );
  if (opts.out) {
    writeFileSync(opts.out, JSON.stringify({ summary, options: opts, results }, null, 1));
    log('Wrote', opts.out);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
