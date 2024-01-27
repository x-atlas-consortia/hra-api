import query from '../queries/biomarker-tree-model.rq';
import { executeFilteredQuery } from '../utils/execute-sparql.js';
import { formatTreeModel } from '../utils/format-tree-model.js';

/**
 * Retrieves the biomarker tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getBiomarkerTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return formatTreeModel(await executeFilteredQuery(query, filter, endpoint));
}
