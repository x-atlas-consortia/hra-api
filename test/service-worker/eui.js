#!/usr/bin/env node
/**
 * End-to-end check of the EUI example (eui-client-side) with the service worker: opens the page in a headless
 * browser, waits until the EUI has loaded its data, and checks that every API request was answered by the service
 * worker without an error. See README.md.
 *
 * Usage: node test/service-worker/eui.js [options]
 *   --page <url>         The EUI example page (default http://localhost:48092/index.html)
 *   --screenshot <file>  Save a screenshot of the loaded EUI
 *   --timeout <s>        Seconds to wait for the EUI's API requests to finish (default 300)
 */
import { chromium } from 'playwright';
import { waitForServiceWorker } from './lib.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const opts = {
  page: arg('--page', 'http://localhost:48092/index.html'),
  screenshot: arg('--screenshot'),
  timeoutMs: Number(arg('--timeout', 300)) * 1000,
};

// The EUI's own requests that are expected to fail outside of the HRA portals (e.g., analytics)
const IGNORED_ERRORS = /googletagmanager|google-analytics|favicon/;

function log(...args) {
  console.log(new Date().toISOString().slice(11, 19), ...args);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const apiRequests = new Map();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`page error: ${err}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !IGNORED_ERRORS.test(msg.text())) {
      errors.push(`console: ${msg.text()}`);
    }
  });
  page.on('request', (req) => {
    if (new URL(req.url()).pathname.startsWith('/api/')) {
      apiRequests.set(req, { url: req.url(), method: req.method(), start: Date.now() });
    }
  });
  page.on('requestfinished', async (req) => {
    const entry = apiRequests.get(req);
    if (entry) {
      const resp = await req.response();
      Object.assign(entry, { status: resp?.status(), fromServiceWorker: resp?.fromServiceWorker(), ms: Date.now() - entry.start });
    }
  });
  page.on('requestfailed', (req) => {
    const entry = apiRequests.get(req);
    if (entry) {
      Object.assign(entry, { failed: req.failure()?.errorText ?? 'failed', ms: Date.now() - entry.start });
    }
  });

  log('Opening', opts.page);
  await page.goto(opts.page);
  await waitForServiceWorker(page);
  log('Service worker is active, waiting for the EUI');
  await page.waitForSelector('ccf-eui', { timeout: 60000 });

  // Wait until the EUI has sent its API requests and all of them have finished
  const deadline = Date.now() + opts.timeoutMs;
  let quietSince = Date.now();
  let lastCount = -1;
  while (Date.now() < deadline) {
    const pending = [...apiRequests.values()].filter((r) => r.ms === undefined).length;
    if (apiRequests.size !== lastCount || pending > 0) {
      quietSince = Date.now();
      lastCount = apiRequests.size;
    }
    if (apiRequests.size > 0 && pending === 0 && Date.now() - quietSince > 10000) {
      break;
    }
    await page.waitForTimeout(1000);
  }
  if (opts.screenshot) {
    await page.screenshot({ path: opts.screenshot });
    log('Screenshot saved to', opts.screenshot);
  }
  await browser.close();

  const requests = [...apiRequests.values()];
  // The EUI cancels requests that it no longer needs (e.g., when the filter changes while loading)
  const cancelled = (r) => r.failed === 'net::ERR_ABORTED';
  const bad = requests.filter(
    (r) => !cancelled(r) && (r.failed || r.ms === undefined || !(r.status >= 200 && r.status < 300) || !r.fromServiceWorker)
  );
  for (const r of requests) {
    const path = new URL(r.url).pathname;
    const result = r.failed ?? (r.ms === undefined ? 'unfinished' : `${r.status}${r.fromServiceWorker ? '' : ' (not from the service worker)'}`);
    log(`${bad.includes(r) ? 'FAIL' : 'ok  '} ${r.method} ${path} ${result} ${r.ms ?? '-'} ms`);
  }
  if (errors.length > 0) {
    console.log('\nBrowser errors:\n' + errors.slice(0, 20).join('\n'));
  }
  const ok = requests.length > 0 && bad.length === 0 && errors.length === 0;
  console.log(`\n${requests.length} API requests, ${bad.length} failed, ${errors.length} browser errors`);
  console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL');
  process.exit(ok ? 0 : 1);
}

main();
