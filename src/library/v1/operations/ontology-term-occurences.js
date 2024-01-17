import frame from '../frames/basic.jsonld';
import query from '../queries/ontology-term-occurences.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { formatTermOccurences } from '../utils/format-term-occurences.js';

/**
 * Retrieves ontology term occurrences
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to ontology term occurrences
 */
export async function getOntologyTermOccurences(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return formatTermOccurences(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
