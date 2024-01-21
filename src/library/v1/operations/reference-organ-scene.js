import { getSpatialGraph } from '../../shared/spatial/spatial-graph';
import frame from '../frames/scene.jsonld';
import refOrganQuery from '../queries/scene-organs.rq';
import query from '../queries/scene.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { reformatSceneNodes } from '../utils/format-scene-nodes.js';

function filterRefOrganQuery(organIri, filter) {
  const hasSexFilter = filter?.sex !== undefined && filter?.sex?.toLowerCase() !== 'both';
  let values;
  if (hasSexFilter) {
    const sex = filter.sex.toLowerCase() === 'male' ? 'Male' : 'Female';
    values = `VALUES (?representation_of ?sex) { (<${organIri}> "${sex}") }`;
  } else {
    values = `VALUES (?representation_of) { (<${organIri}>) }`;
  }
  return refOrganQuery.replace('#{{VALUES}}', values);
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
    getSpatialGraph(endpoint),
  ]);
  const nodes = [...(refOrgans?.['@graph'] ?? []), ...(extractionSites?.['@graph'] ?? [])];
  return reformatSceneNodes(nodes, spatialGraph, organIri);
}
