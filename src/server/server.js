import { ensureNamedGraphs } from '../library/shared/utils/ensure-named-graphs.js';
import { DEFAULT_GRAPHS } from '../library/v1/utils/dataset-graph/create-dataset-graph.js';
import app from './app.js';
import { port, sparqlEndpoint } from './environment.js';

// Start the server
const PORT = port();
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);

  console.log('Preparing database...');
  ensureNamedGraphs(DEFAULT_GRAPHS, sparqlEndpoint());
});
