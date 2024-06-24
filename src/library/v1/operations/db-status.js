import { clearSpatialGraph } from '../../shared/spatial/spatial-graph.js';
import { select } from '../../shared/utils/sparql.js';
import query from '../queries/get-dataset-info.rq';

/**
 * Retrieves the database status
 * @param {Object} filter - An object containing query filters (unused)
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Object} - An object containing database status information
 */
export async function getDbStatus(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  if (!filter.sessionToken) {
    const results = {
      status: 'Ready',
      message: 'Database successfully loaded',
      checkback: 3600000,
      loadTime: 22594,
      timestamp: new Date().toISOString(),
    };
    return results;
  } else {
    const infoQuery = query.replace('urn:hra-api:TOKEN:ds-graph', `urn:hra-api:${filter.sessionToken}:ds-graph`);
    const status = await select(infoQuery, endpoint);

    const results =
      status.length > 0
        ? status[0]
        : {
            status: 'Error',
            message: 'Unknown error while loading database',
            checkback: 3600000,
            loadTime: 22594,
            timestamp: new Date().toISOString(),
          };

    results.loadTime = results.loadTime || new Date(results.timestamp) - new Date(results.startTime);

    if (results.status === 'Ready') {
      // Reset the spatial graph after loading a new dataset
      clearSpatialGraph();
    }

    return results;
  }
}
