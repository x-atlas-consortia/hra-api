import query from '../queries/dataset-technology-names.rq';
import { executeFilteredQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves dataset technology names
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Array>} - A promise that resolves to an array of technology names
 */
export async function getDatasetTechnologyNames(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return (await executeFilteredQuery(query, filter, endpoint)).map((row) => row.technology);
}
