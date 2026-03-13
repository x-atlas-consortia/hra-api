import frame from '../frames/rui-locations.jsonld';
import query from '../queries/rui-locations.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureGraphArray, normalizeJsonLd } from '../utils/jsonld-compat.js';

function reformatResponse(jsonld) {
  const results = normalizeJsonLd(
    ensureGraphArray(jsonld),
    new Set(['datasets', 'samples', 'sections', 'ccf_annotations']),
    undefined,
    new Set([
      'x_dimension',
      'y_dimension',
      'z_dimension',
      'x_translation',
      'y_translation',
      'z_translation',
      'x_rotation',
      'y_rotation',
      'z_rotation',
      'x_scaling',
      'y_scaling',
      'z_scaling',
    ]),
  );
  return {
    '@context': 'https://hubmapconsortium.github.io/ccf-ontology/ccf-context.jsonld',
    '@graph': results,
  };
}

/**
 * Retrieves a Dataset Graph
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to RUI location data
 */
export async function getDsGraph(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
