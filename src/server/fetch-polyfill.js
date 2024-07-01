import fetch, { Headers, Request, Response } from 'node-fetch';

// Use node-fetch's fetch
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
