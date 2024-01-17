import query from '../queries/tissue-provider-names.rq';
import { executeFilteredQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves tissue provider names
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Array>} - A promise that resolves to an array of tissue provider names
 */
export async function getTissueProviderNames(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return (await executeFilteredQuery(query, filter, endpoint)).map((row) => row.provider);
}
