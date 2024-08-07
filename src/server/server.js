import { schedule } from 'node-cron';
import { pruneDatasetGraphs } from '../library/v1/utils/dataset-graph.js';
import app from './app.js';
import { isWritable, port, pruningSchedule, sparqlEndpoint } from './environment.js';

// Start the server
const PORT = port();
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});

schedule(pruningSchedule(), () => {
  if (isWritable()) {
    pruneDatasetGraphs(sparqlEndpoint());
  }
});
