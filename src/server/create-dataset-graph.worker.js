import fetch, { Headers, Request, Response } from 'node-fetch';
import { workerData } from 'worker_threads';
import { createDatasetGraph } from '../library/v1/utils/dataset-graph.js';

// Use node-fetch's fetch
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;

const { token, request, endpoint } = workerData;

await createDatasetGraph(token, request, endpoint);
