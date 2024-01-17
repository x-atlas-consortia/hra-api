import frame from '../frames/scene.jsonld';
import refOrganQuery from '../queries/scene-organs.rq';
import query from '../queries/scene.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { reformatSceneNodes } from '../utils/format-scene-nodes.js';

/**
 * Retrieves scene data
 * @param {Object} filter - An object containing query filters (unused)
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Array} - An empty array as scene data
 */
export async function getScene(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const results = await executeFilteredConstructQuery(query, filter, frame, endpoint);
  const refOrgans = await executeFilteredConstructQuery(refOrganQuery, filter, frame, endpoint);
  const nodes = [...(refOrgans['@graph'] ?? []), ...(results['@graph'] ?? [])];
  return reformatSceneNodes(nodes);
}
