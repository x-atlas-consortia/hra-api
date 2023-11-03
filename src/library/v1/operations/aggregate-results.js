import query from '../queries/aggregate-results.rq';
import { executeFilteredQuery } from '../utils/execute-sparql';

/**
 * Retrieves aggregate results.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Array>} - A promise that resolves to an array of aggregate results.
 */
export async function getAggregateResults(filter) {
  return executeFilteredQuery(query, filter);
}
