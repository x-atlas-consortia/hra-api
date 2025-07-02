import query from '../queries/consortium-names.rq';
import { executeFilteredQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves consortium names
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Array>} - A promise that resolves to an array of consortium names
 */
export async function getConsortiumNames(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return (await executeFilteredQuery(query, filter, endpoint)).map((row) => row.consortium);
}
