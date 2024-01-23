import frame from '../frames/reference-organs.jsonld';
import query from '../queries/reference-organs.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureGraphArray, normalizeJsonLd } from '../utils/jsonld-compat.js';

function reformatResponse(results) {
  return normalizeJsonLd(ensureGraphArray(results));
}

/**
 * Retrieves reference organs
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getReferenceOrgans(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
