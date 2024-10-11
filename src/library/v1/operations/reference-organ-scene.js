import { getSpatialGraph } from '../../shared/spatial/spatial-graph';
import frame from '../frames/scene.jsonld';
import refOrganQuery from '../queries/scene-organs.rq';
import query from '../queries/scene.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { reformatSceneNodes } from '../utils/format-scene-nodes.js';
import { ensureGraphArray, expandIri } from '../utils/jsonld-compat.js';

function filterRefOrganQuery(organIri, filter) {
  const hasSexFilter = filter?.sex !== undefined && filter?.sex?.toLowerCase() !== 'both';
  let values = `
    FILTER (?representation_of = <${organIri}>)
`;
  if (hasSexFilter) {
    const sex = filter.sex.toLowerCase() === 'male' ? 'Male' : 'Female';
    values += `
    FILTER (?sex = "${sex}")
`;
  }
  return refOrganQuery.replace('#{{ORGAN_FILTER}}', values);
}

/**
 * Retrieves scene data for a single reference organ
 * @param {string} organIri - the ontology term of the reference organ
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Array} - An empty array as scene data
 */
export async function getReferenceOrganScene(organIri, filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const [extractionSites, refOrgans, spatialGraph] = await Promise.all([
    executeFilteredConstructQuery(query, filter, frame, endpoint),
    executeFilteredConstructQuery(filterRefOrganQuery(organIri, filter), filter, frame, endpoint),
    getSpatialGraph(endpoint, true, filter.sessionToken),
  ]);
  const refOrganNodes = ensureGraphArray(refOrgans);
  if (refOrganNodes.length > 0) {
    const nodes = [...refOrganNodes, ...ensureGraphArray(extractionSites)];
    const targetIri = expandIri(refOrganNodes[0]['@id']);
    return reformatSceneNodes(nodes, spatialGraph, targetIri, false);
  } else {
    return [];
  }
}
