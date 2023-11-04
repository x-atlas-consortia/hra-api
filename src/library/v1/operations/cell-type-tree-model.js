import query from '../queries/cell-type-tree-model.rq';
import frame from '../frames/cell-type-tree-model.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves the cell type tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getCellTypeTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return await executeFilteredConstructQuery(query, filter, frame, endpoint);
}
