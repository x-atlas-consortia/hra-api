import query from '../queries/ontology-term-occurences.rq';
import frame from '../frames/basic.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves ontology term occurrences
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to ontology term occurrences
 */
export async function getOntologyTermOccurences(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const results = await executeFilteredConstructQuery(query, filter, frame, endpoint);
  const reformatted = results['@graph'].reduce((acc, row) => ((acc[row['@id']] = parseInt(row['count'])), acc), {});
  return reformatted;
}
