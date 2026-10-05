#!/usr/bin/env node
/**
 * Checks that the service worker (dist/sw.js) returns the same responses as the server.
 *
 * Opens a page that registers the service worker in a headless browser (Playwright), sends the curated harness cases
 * (see test/compare/lib/curated-cases.js) through the service worker, and compares the responses with the same
 * requests sent to an HRA API server that uses the same SPARQL endpoint as the service worker. See README.md.
 *
 * Usage: node test/service-worker/run.js [options]
 *   --page <url>         Page that registers the service worker (default http://localhost:48091/index.html)
 *   --server <url>       HRA API server to compare with (default http://localhost:48090/)
 *   --api <url>          The HRA API that the service worker forwards some routes to (see API_ROUTES), which these
 *                        routes are compared with (default https://apps.humanatlas.io/api/)
 *   --grep <regex>       Only run cases whose id matches
 *   --concurrency <n>    Number of cases sent at once (default 2)
 *   --out <file>         Write the results (JSON) to this file
 */
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { compareResponses, PASSING, VOLATILE } from '../compare/lib/compare.js';
import { curatedCases } from '../compare/lib/curated-cases.js';
import { mapLimit, sendCase } from '../compare/lib/http.js';
import { API_ROUTES } from '../../src/service-worker/routes/v1/api-routes.js';
import { waitForServiceWorker } from './lib.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const opts = {
  page: arg('--page', 'http://localhost:48091/index.html'),
  server: arg('--server', 'http://localhost:48090/'),
  api: arg('--api', 'https://apps.humanatlas.io/api/'),
  grep: arg('--grep') ? new RegExp(arg('--grep')) : undefined,
  concurrency: Number(arg('--concurrency', 2)),
  out: arg('--out'),
};

// Routes the service worker does not provide: ds-graph needs node, and v1/sparql proxies to a SPARQL endpoint
const UNSUPPORTED = /^(ds-graph|kg)\/|^v1\/sparql/;

function log(...args) {
  console.log(new Date().toISOString().slice(11, 19), ...args);
}

/** Sends a test case through the service worker (its routes are under /api/ relative to the page) */
async function sendThroughServiceWorker(page, testCase) {
  return page.evaluate(async ({ path, query, method, body }) => {
    const url = new URL(`api/${path}`, location.href);
    if (query) {
      url.search = query;
    }
    const init = { method: method ?? 'GET', headers: {} };
    if (body !== undefined) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (typeof body !== 'string') {
        init.headers['Content-Type'] = 'application/json';
      }
    }
    const start = performance.now();
    try {
      const resp = await fetch(url, init);
      const text = await resp.text();
      return {
        status: resp.status,
        contentType: (resp.headers.get('content-type') ?? '').split(';')[0],
        body: text,
        bytes: text.length,
        ms: performance.now() - start,
      };
    } catch (err) {
      return { error: String(err?.message ?? err), ms: performance.now() - start };
    }
  }, testCase);
}

async function main() {
  const cases = curatedCases({ specFile: resolve(ROOT, 'hra-api-spec.yaml'), datasets: [] })
    .filter((c) => !UNSUPPORTED.test(c.route))
    .filter((c) => !opts.grep || opts.grep.test(c.id));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    // The browser logs every 4xx/5xx response; error responses are already compared
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
      errors.push(msg.text());
    }
  });

  // sw-loader.js registers the service worker and reloads the page once so that it controls the page
  log('Opening', opts.page);
  await page.goto(opts.page);
  await waitForServiceWorker(page);
  log('Service worker is active');

  log(`Comparing ${cases.length} cases (concurrency ${opts.concurrency})`);
  let done = 0;
  const results = await mapLimit(cases, opts.concurrency, async (testCase) => {
    // Routes that the service worker forwards to the HRA API are compared with the API's responses
    const baseline = API_ROUTES.includes(testCase.route.replace(/^v1\//, '')) ? opts.api : opts.server;
    const send = () => Promise.all([sendCase(baseline, testCase), sendThroughServiceWorker(page, testCase)]);
    const failed = (r) => r.error || r.status >= 500;
    let [ra, rb] = await send();
    if (failed(ra) || failed(rb)) {
      // Retry once, e.g., when the SPARQL endpoint timed out
      [ra, rb] = await send();
    }
    let { category, details } = compareResponses(ra, rb, { volatile: VOLATILE[testCase.route] });
    if (failed(ra) && failed(rb)) {
      // Both failed (usually the SPARQL endpoint): the service worker could not be checked
      category = 'unverified';
      details = { a: ra.error ?? `status ${ra.status}`, b: rb.error ?? `status ${rb.status}` };
    }
    const ok = PASSING.has(category);
    done++;
    log(`[${done}/${cases.length}] ${ok ? 'ok  ' : 'FAIL'} ${category.padEnd(12)} ${testCase.id}`,
      `(server ${Math.round(ra.ms)} ms, service worker ${Math.round(rb.ms)} ms)`);
    return { id: testCase.id, route: testCase.route, category, ok, status: [ra.status, rb.status], details, ms: [ra.ms, rb.ms] };
  });
  await browser.close();

  const counts = results.reduce((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + 1 }), {});
  const failures = results.filter((r) => !r.ok);
  console.log('\nResults:', JSON.stringify(counts));
  for (const f of failures) {
    console.log(`\n${f.category} ${f.id} (status ${f.status.join('/')})\n${JSON.stringify(f.details, null, 1).slice(0, 1500)}`);
  }
  if (errors.length > 0) {
    console.log('\nBrowser errors:', errors.slice(0, 20));
  }
  if (opts.out) {
    writeFileSync(opts.out, JSON.stringify({ counts, results, errors }, null, 1));
  }
  console.log(failures.length === 0 ? '\nRESULT: PASS' : `\nRESULT: FAIL (${failures.length} cases)`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main();
