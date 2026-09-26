import { construct, select } from '../../shared/utils/sparql.js';
import frame from '../frames/extraction-site.jsonld';
import query from '../queries/extraction-site.rq';
import { normalizeJsonLd } from '../utils/jsonld-compat.js';
import { getCollisions } from './collisions.js';

async function reformatResponse(jsonld) {
  const results = normalizeJsonLd(jsonld, new Set(['ccf_annotations']));
  if (!results['@id']) {
    console.log(results);
    return undefined;
  } else {
    if (results.placement && !results.placement.placement_date && results.creation_date) {
      results.placement.placement_date = results.creation_date;
    }
    if (!results.ccf_annotations) {
      const collisions = await getCollisions(results);
      console.log(collisions);
      if (collisions?.length > 0) {
        results.ccf_annotations = Array.from(new Set(collisions.map((c) => c.representation_of)));
      } else {
        results.ccf_annotations = [];
      }
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
// Characters not allowed in a SPARQL IRI reference
const INVALID_IRI_CHARS = /[\s<>"{}|^`\\]/;

export async function getExtractionSite(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  if (!filter.iri || INVALID_IRI_CHARS.test(filter.iri)) {
    return undefined;
  }
  // Limit the search space to the millitome collection when encountering millitome IRIs
  const from = filter.iri.startsWith('https://purl.humanatlas.io/millitome/')
    ? 'FROM <https://purl.humanatlas.io/collection/hra-millitomes>'
    : '';

  // Use the IRIs as constants (rather than variables or a VALUES binding), which is planned and executed much
  // faster by some triple stores (e.g., QLever). The placement is looked up first.
  let filteredQuery = query.replaceAll('?rui_location', `<${filter.iri}>`).replace('#{{FROM}}', from);
  const placements = await select(
    `SELECT DISTINCT ?placement ${from} WHERE { ?placement <http://purl.org/ccf/placement_for> <${filter.iri}> . }`,
    endpoint
  );
  const placement = String(placements[0]?.placement ?? '');
  if (placements.length === 1 && /^[a-z][a-z0-9+.-]*:/i.test(placement) && !placement.startsWith('_:') && !INVALID_IRI_CHARS.test(placement)) {
    filteredQuery = filteredQuery.replaceAll('?SpatialPlacement', `<${placement}>`);
  }
  return reformatResponse(await construct(filteredQuery, endpoint, frame));
}
