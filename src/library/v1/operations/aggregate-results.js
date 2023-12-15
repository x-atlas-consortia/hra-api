import query from '../queries/aggregate-results.rq';
import frame from '../frames/basic.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves aggregate results
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Array>} - A promise that resolves to an array of aggregate results
 */
export async function getAggregateResults(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const results = await executeFilteredConstructQuery(query, filter, frame, endpoint);
  const reformatted = results['@graph'].map(({label, count}) => ({label, count}));
  return reformatted;
}
