import { construct } from '../../shared/utils/sparql.js';
import frame from '../frames/extraction-site.jsonld';
import query from '../queries/extraction-site.rq';
import { normalizeJsonLd } from '../utils/jsonld-compat.js';

function reformatResponse(jsonld) {
  const results = normalizeJsonLd(jsonld, new Set(['ccf_annotations']));
  if (!results['@id']) {
    console.log(results);
    return undefined;
  } else {
    results.ccf_annotations = results.ccf_annotations || [];
    if (results.placement && !results.placement.placement_date && results.creation_date) {
      results.placement.placement_date = results.creation_date;
    }
    return results;
  } 
}

/**
 * Retrieves RUI locations
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to RUI location data
 */
export async function getExtractionSite(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const filteredQuery = query.replace('#{{FILTER}}', `VALUES (?rui_location) { (<${filter.iri}>) }`);
  return reformatResponse(await construct(filteredQuery, endpoint, frame));
}
