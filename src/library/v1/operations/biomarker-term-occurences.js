import query from '../queries/biomarker-term-occurences.rq';
import frame from '../frames/biomarker-term-occurences.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves biomarker term occurrences
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to biomarker term occurrences
 */
export async function getBiomarkerTermOccurences(filter) {
  const results = await executeFilteredConstructQuery(query, filter, frame, endpoint);
  const reformatted = results['@graph'].reduce((acc, row) => ((acc[row['@id']] = parseInt(row['count'])), acc), {});
  return reformatted;
}
