import query from '../queries/ontology-tree-model.rq';
import frame from '../frames/tree-model.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves the ontology tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getOntologyTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return await executeFilteredConstructQuery(query, filter, frame, endpoint);
}
