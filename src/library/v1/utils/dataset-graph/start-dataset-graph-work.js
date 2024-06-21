import { Worker } from 'worker_threads';

export async function startDatasetWork(token, request, endpoint) {
  // TODO: write config / db loading status to blazegraph

  const worker = new Worker('./dist/create-dataset-graph.worker.js', {
    workerData: { token, request, endpoint },
  });
}
