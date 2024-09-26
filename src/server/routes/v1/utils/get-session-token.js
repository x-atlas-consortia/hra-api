import Queue from 'mini-queue';
import { Worker } from 'worker_threads';
import { clearSpatialGraph } from '../../../../library/shared/spatial/spatial-graph.js';
import { createSessionToken } from '../../../../library/v1/operations/session-token.js';
import { activeQueryLimit, isWritable, sparqlEndpoint } from '../../../environment.js';

const QUEUE = new Queue({ activeLimit: activeQueryLimit() });

QUEUE.on('process', (job, jobDone) => {
  const worker = new Worker('./dist/create-dataset-graph.worker.js', {
    workerData: job.data,
  });
  worker.on('exit', (_exitCode) => {
    clearSpatialGraph();
    jobDone();
  });
});

async function startDatasetWork(token, request, endpoint) {
  QUEUE.createJob({ token, request, endpoint });
}

export function getSessionTokenHandler() {
  return async (req, res, _next) => {
    const { dataSources, filter } = req.body;

    if (!isWritable() || (!dataSources && !filter)) {
      res.json({ token: '' }); // Use the default dataset graph
      return;
    }

    try {
      const token = await createSessionToken(req.body, sparqlEndpoint(), startDatasetWork);
      res.json(token);
    } catch (err) {
      res.status(500).json({
        error: `Error creating a session token: ${err.message}`,
      });
    }
  };
}
