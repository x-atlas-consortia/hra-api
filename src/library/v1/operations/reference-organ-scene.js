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
  const filteredRefOrganQuery = filterRefOrganQuery(organIri, filter);
  const results = await executeFilteredConstructQuery(query, filter, frame, endpoint);
  const refOrgans = await executeFilteredConstructQuery(filteredRefOrganQuery, filter, frame, endpoint);

  delete refOrgans['@context'];
  const nodes = [...(refOrgans['@graph'] ?? [refOrgans]), ...(results['@graph'] ?? [])];
  return reformatSceneNodes(nodes);
}
