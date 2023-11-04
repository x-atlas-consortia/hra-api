import query from '../queries/reference-organs.rq';
import frame from '../frames/reference-organs.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves reference organs
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getReferenceOrgans(filter) {
  return await executeFilteredConstructQuery(query, filter, frame, endpoint);
}
