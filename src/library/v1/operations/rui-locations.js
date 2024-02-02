import query from '../queries/rui-locations.rq';
import frame from '../frames/rui-locations.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureGraphArray, normalizeJsonLd } from '../utils/jsonld-compat.js';

function reformatResponse(jsonld) {
  const results = normalizeJsonLd(ensureGraphArray(jsonld), new Set(['datasets', 'samples', 'sections', 'ccf_annotations']));
  return {
    '@context': 'https://hubmapconsortium.github.io/ccf-ontology/ccf-context.jsonld',
    '@graph': results
  };
}

/**
 * Retrieves RUI locations
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to RUI location data
 */
export async function getRuiLocations(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
