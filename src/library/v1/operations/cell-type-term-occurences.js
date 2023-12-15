import query from '../queries/cell-type-term-occurences.rq';
import frame from '../frames/basic.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves cell type term occurrences
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to cell type term occurrences
 */
export async function getCellTypeTermOccurences(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const results = await executeFilteredConstructQuery(query, filter, frame, endpoint);
  const reformatted = results['@graph'].reduce((acc, row) => ((acc[row['@id']] = parseInt(row['count'])), acc), {});
  return reformatted;
}
