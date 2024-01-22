import frame from '../frames/reference-organs.jsonld';
import query from '../queries/reference-organs.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureGraphArray, ensureNumber, expandIris } from '../utils/jsonld-compat.js';

function reformatResponse(results) {
  const resultArray = ensureGraphArray(results);
  for (const organ of resultArray) {
    Object.assign(organ, {
      x_dimension: ensureNumber(organ.x_dimension),
      y_dimension: ensureNumber(organ.y_dimension),
      z_dimension: ensureNumber(organ.z_dimension),
      rui_rank: ensureNumber(organ.rui_rank),
    });
  }
  return expandIris(resultArray);
}

/**
 * Retrieves reference organs
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getReferenceOrgans(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const results = await executeFilteredConstructQuery(query, filter, frame, endpoint);
  return reformatResponse(results);
}
