import Queue from 'mini-queue';
import { Worker } from 'worker_threads';

const QUEUE = new Queue({ activeLimit: 4 });

QUEUE.on('process', (job, jobDone) => {
  const worker = new Worker('./dist/create-dataset-graph.worker.js', {
    workerData: job.data,
  });
  worker.on('exit', (_exitCode) => jobDone());
});

export async function startDatasetWork(token, request, endpoint) {
  // TODO: write config / db loading status to blazegraph

  QUEUE.createJob({ token, request, endpoint });
}
