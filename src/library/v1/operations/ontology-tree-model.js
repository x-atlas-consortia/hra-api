import frame from '../frames/tree-model.jsonld';
import query from '../queries/ontology-tree-model.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { formatTreeModel } from '../utils/format-tree-model.js';

/**
 * Retrieves the ontology tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getOntologyTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return formatTreeModel(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
