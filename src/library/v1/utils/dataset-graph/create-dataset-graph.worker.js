import { workerData } from 'worker_threads';
import { createDatasetGraph } from './create-dataset-graph.js';

const { token, request, endpoint } = workerData;

await createDatasetGraph(token, request, endpoint);
