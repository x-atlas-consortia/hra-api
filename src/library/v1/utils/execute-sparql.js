import { construct, select } from '../../utils/sparql';
import { filterSparqlQuery } from './filter-sparql-query';

/**
 * Executes a filtered SPARQL query.
 * @param {string} query - The path to the SPARQL query file.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Array>} - A promise that resolves to an array of query results.
 */
export async function executeFilteredQuery(query, filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  try {
    // Get results as an array of objects
    const filteredSparqlQuery = filterSparqlQuery(query, filter);
    const results = await select(filteredSparqlQuery, endpoint);
    return results;
  } catch (error) {
    console.error('Error executing SPARQL query:', error.message);
  }
}

/**
 * Executes a filtered SPARQL construct query and applies JSON-LD framing.
 * @param {string} query - The path to the SPARQL query file.
 * @param {Object} filter - An object containing query filters.
 * @param {string} frame - The path to the JSON-LD framing configuration file.
 * @returns {Promise<Object>} - A promise that resolves to the constructed JSON-LD data.
 */
export async function executeFilteredConstructQuery(
  query,
  filter,
  frame = undefined,
  endpoint = 'https://lod.humanatlas.io/sparql'
) {
  try {
    // Get results as an array of objects
    const filteredSparqlQuery = filterSparqlQuery(query, filter);
    const results = await construct(filteredSparqlQuery, endpoint, frame);
    return results;
  } catch (error) {
    console.error('Error executing SPARQL query:', error.message);
  }
}
