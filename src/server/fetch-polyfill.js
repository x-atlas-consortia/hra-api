import http from 'http';
import fetch, { Headers, Request, Response } from 'node-fetch';

// Do not reuse (keep alive) plain http connections, e.g., to the embedded triple store. Reused connections to
// QLever add ~40ms of latency to every request (Nagle's algorithm / delayed ACKs), while new connections on
// localhost are cheap. https connections (remote services) keep using the default agent.
const httpAgent = new http.Agent({ keepAlive: false });

// Use node-fetch's fetch
globalThis.fetch = (url, options = {}) =>
  fetch(url, { agent: (parsedUrl) => (parsedUrl.protocol === 'http:' ? httpAgent : undefined), ...options });
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
