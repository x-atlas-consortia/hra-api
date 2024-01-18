import { getSpatialGraph } from '../../shared/spatial/spatial-graph.js';
import frame from '../frames/scene.jsonld';
import refOrganQuery from '../queries/scene-organs.rq';
import query from '../queries/scene.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { reformatSceneNodes } from '../utils/format-scene-nodes.js';

function getTargetIri(filter) {
  switch (filter.sex) {
    case 'Male':
      return 'http://purl.org/ccf/latest/ccf.owl#VHMale';
    case 'Female':
      return 'http://purl.org/ccf/latest/ccf.owl#VHFemale';
    default:
      return 'http://purl.org/ccf/latest/ccf.owl#VHBothSexes';
  }
}

/**
 * Retrieves scene data
 * @param {Object} filter - An object containing query filters (unused)
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Array} - An empty array as scene data
 */
export async function getScene(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const [extractionSites, refOrgans, spatialGraph] = await Promise.all([
    executeFilteredConstructQuery(query, filter, frame, endpoint),
    executeFilteredConstructQuery(refOrganQuery, filter, frame, endpoint),
    getSpatialGraph(endpoint),
  ]);
  const nodes = [...(refOrgans['@graph'] ?? []), ...(extractionSites['@graph'] ?? [])];
  return reformatSceneNodes(nodes, spatialGraph, getTargetIri(filter));
}
