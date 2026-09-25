#!/usr/bin/env node
/**
 * Replays captured SPARQL queries (see sparql-proxy.js) directly against both triple stores and compares the
 * results. This isolates engine differences from the API's post-processing.
 *
 * Usage: node test/compare/sparql-compare.js [--a http://localhost:18081/blazegraph/namespace/kb/sparql]
 *          [--b http://localhost:28081/] [--queries test/compare/cases/sparql-queries.jsonl] [--out dir]
 *          [--runs 3] [--grep regex] [--concurrency 2]
 *
 * SELECT results are compared as multisets of CSV rows (numbers normalized); CONSTRUCT results as sets of
 * N-Triples (blank nodes normalized; QLever's xsd:int is compared as xsd:integer).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { mapLimit } from './lib/http.js';
import { normalizeNumber, stableStringify } from './lib/normalize.js';
import { geomean, summarize } from './lib/stats.js';

const HERE = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const opts = {
  a: arg('--a', 'http://localhost:18081/blazegraph/namespace/kb/sparql'),
  b: arg('--b', 'http://localhost:28081/'),
  queries: resolve(arg('--queries', resolve(HERE, 'cases/sparql-queries.jsonl'))),
  out: resolve(arg('--out', resolve(HERE, 'report'))),
  runs: Number(arg('--runs', 3)),
  grep: arg('--grep') ? new RegExp(arg('--grep')) : undefined,
  concurrency: Number(arg('--concurrency', 2)),
};

function isConstruct(query) {
  return /^\s*CONSTRUCT\b/im.test(query.replace(/^\s*(PREFIX|BASE)\b.*$/gim, ''));
}

/** The captured queries come from the QLever side; re-enable Blazegraph's query hint for a faithful baseline */
function forBlazegraph(query) {
  return query.replace('#hint:SubQuery hint:runOnce true', 'hint:SubQuery hint:runOnce true');
}

async function run(endpoint, query, accept) {
  const body = new URLSearchParams({ query });
  const start = performance.now();
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: accept, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, text, ms: performance.now() - start };
}

function normalizeCell(value) {
  if (value === '' || value === undefined || value === null) return '';
  const s = String(value);
  if (s.startsWith('_:')) return '_:b';
  const n = Number(s);
  return s.trim() !== '' && Number.isFinite(n) ? String(normalizeNumber(n)) : s;
}

function selectRows(text) {
  const { data, meta } = Papa.parse(text, { header: true, skipEmptyLines: true });
  const fields = [...(meta.fields ?? [])].sort();
  return data.map((row) => stableStringify(fields.map((f) => normalizeCell(row[f])))).sort();
}

function constructTriples(text) {
  return [
    ...new Set(
      text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('#'))
        .map((l) =>
          l
            .replace(/_:[A-Za-z0-9_\-.]+/g, '_:b')
            .replace('^^<http://www.w3.org/2001/XMLSchema#int>', '^^<http://www.w3.org/2001/XMLSchema#integer>')
        )
    ),
  ].sort();
}

function diff(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  return { onlyA: a.filter((x) => !sb.has(x)), onlyB: b.filter((x) => !sa.has(x)) };
}

async function compareQuery(entry) {
  const construct = isConstruct(entry.query);
  const acceptA = construct ? 'text/plain' : 'text/csv';
  const acceptB = construct ? 'application/n-triples' : 'text/csv';
  const timings = { a: [], b: [] };
  let ra, rb;
  for (let i = 0; i < opts.runs; i++) {
    ra = await run(opts.a, forBlazegraph(entry.query), acceptA);
    rb = await run(opts.b, entry.query, acceptB);
    timings.a.push(ra.ms);
    timings.b.push(rb.ms);
  }
  const result = {
    hash: entry.hash,
    type: construct ? 'construct' : 'select',
    status: [ra.status, rb.status],
    a: summarize(timings.a),
    b: summarize(timings.b),
  };
  if (!ra.ok || !rb.ok) {
    return { ...result, category: 'error', errors: [ra.ok ? undefined : ra.text.slice(0, 1000), rb.ok ? undefined : rb.text.slice(0, 1000)], query: entry.query };
  }
  const la = construct ? constructTriples(ra.text) : selectRows(ra.text);
  const lb = construct ? constructTriples(rb.text) : selectRows(rb.text);
  const { onlyA, onlyB } = diff(la, lb);
  const sameCounts = la.length === lb.length;
  const category = onlyA.length === 0 && onlyB.length === 0 ? (sameCounts ? 'identical' : 'duplicates-differ') : 'different';
  return {
    ...result,
    category,
    counts: [la.length, lb.length],
    onlyA: onlyA.length,
    onlyB: onlyB.length,
    samples: category === 'identical' ? undefined : { onlyA: onlyA.slice(0, 5), onlyB: onlyB.slice(0, 5) },
    query: category === 'identical' ? undefined : entry.query,
  };
}

async function main() {
  let entries = readFileSync(opts.queries, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((e) => e.kind === 'query');
  if (opts.grep) entries = entries.filter((e) => opts.grep.test(e.query));
  console.log(`Replaying ${entries.length} captured queries (${opts.runs} runs each)`);

  let done = 0;
  const results = await mapLimit(entries, opts.concurrency, async (entry) => {
    const r = await compareQuery(entry);
    if (++done % 25 === 0 || done === entries.length) console.log(`  ${done}/${entries.length}`);
    return r;
  });

  const counts = {};
  for (const r of results) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const ratios = results.filter((r) => r.category !== 'error').map((r) => r.b.p50 / r.a.p50);
  const summary = {
    queries: results.length,
    counts,
    geomeanP50Ratio: geomean(ratios),
    slower: results.filter((r) => r.b.p50 / r.a.p50 > 1.2 && r.b.p50 > 50).length,
  };
  const outDir = resolve(opts.out, 'sparql-' + new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'sparql-results.json'), JSON.stringify({ summary, results }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
  console.log('Results written to', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
