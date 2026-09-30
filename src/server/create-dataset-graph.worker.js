import { workerData } from 'worker_threads';
import { createDatasetGraph } from '../library/v1/utils/dataset-graph.js';
import './fetch-polyfill.js';

const { token, request, endpoint } = workerData;

await createDatasetGraph(token, request, endpoint);
