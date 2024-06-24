import Queue from 'mini-queue';
import { Worker } from 'worker_threads';
import { update } from '../../../shared/utils/sparql.js';
import query from '../../queries/start-dataset-info.rq';

const QUEUE = new Queue({ activeLimit: 4 });

QUEUE.on('process', (job, jobDone) => {
  const worker = new Worker('./dist/create-dataset-graph.worker.js', {
    workerData: job.data,
  });
  worker.on('exit', (_exitCode) => jobDone());
});

export async function startDatasetWork(token, request, endpoint) {
  const updateQuery = query.replace('urn:hra-api:TOKEN:ds-graph', `urn:hra-api:${token}:ds-graph`);
  update(updateQuery, endpoint);

  QUEUE.createJob({ token, request, endpoint });
}
