/**
 * Sends a test case to a base URL and records status, content type, body and timing.
 * The timing covers the full request until the complete body has been read.
 */
export async function sendCase(baseUrl, testCase, { timeoutMs = 600000 } = {}) {
  const url = new URL(testCase.path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
  if (testCase.query) {
    url.search = testCase.query;
  }
  const init = {
    method: testCase.method ?? 'GET',
    headers: { ...(testCase.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
  };
  if (testCase.body !== undefined) {
    if (typeof testCase.body === 'string') {
      init.body = testCase.body;
    } else {
      init.body = JSON.stringify(testCase.body);
      init.headers['Content-Type'] ??= 'application/json';
    }
  }

  const start = performance.now();
  try {
    const resp = await fetch(url, init);
    const body = await resp.text();
    const ms = performance.now() - start;
    return {
      status: resp.status,
      contentType: (resp.headers.get('content-type') ?? '').split(';')[0],
      body,
      bytes: body.length,
      ms,
    };
  } catch (err) {
    return { error: String(err?.message ?? err), ms: performance.now() - start };
  }
}

/** Waits until a URL responds with a 2xx status */
export async function waitFor(url, { timeoutMs = 600000, intervalMs = 1000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return true;
    } catch {
      // Not up yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

/** Runs async tasks with a concurrency limit, preserving result order */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
