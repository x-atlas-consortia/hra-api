import query from '../queries/biomarker-tree-model.rq';
import frame from '../frames/tree-model.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves the biomarker tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getBiomarkerTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return await executeFilteredConstructQuery(query, filter, frame, endpoint);
}
