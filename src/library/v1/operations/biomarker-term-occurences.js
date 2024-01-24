import frame from '../frames/basic.jsonld';
import query from '../queries/biomarker-term-occurences.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { formatTermOccurences } from '../utils/format-term-occurences.js';

function reformatResponse(jsonld) {
  const results = formatTermOccurences(jsonld);
  results['biomarkers'] = results['http://purl.org/ccf/Biomarker'];
  delete results['http://purl.org/ccf/Biomarker'];
  return results;
}

/**
 * Retrieves biomarker term occurrences
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to biomarker term occurrences
 */
export async function getBiomarkerTermOccurences(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
