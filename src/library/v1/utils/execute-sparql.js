import { construct, select } from '../../shared/utils/sparql';
import { filterSparqlQuery } from './filter-sparql-query';

/**
 * Executes a filtered SPARQL query
 * @param {string} query - The path to the SPARQL query file
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Array>} - A promise that resolves to an array of query results.
 */
export async function executeFilteredQuery(query, filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  let filteredSparqlQuery;
  try {
    // Get results as an array of objects
    filteredSparqlQuery = await filterSparqlQuery(query, filter, endpoint);
    const results = await select(filteredSparqlQuery, endpoint);
    return results;
  } catch (error) {
    console.error('Error executing SELECT query:', error.message, error);
    if (filteredSparqlQuery) {
      console.log('\nBad SPARQL Query: \n', filteredSparqlQuery + '\n\n');
    }
  }
}

/**
 * Executes a filtered SPARQL construct query and applies JSON-LD framing
 * @param {string} query - The path to the SPARQL query file
 * @param {Object} filter - An object containing query filters
 * @param {string} frame - The path to the JSON-LD framing configuration file
 * @param {string} endpoint - The SPARQL endpoint to connect to
 *
 * @returns {Promise<Object>} - A promise that resolves to the constructed JSON-LD data.
 */
export async function executeFilteredConstructQuery(
  query,
  filter,
  frame = undefined,
  endpoint = 'https://lod.humanatlas.io/sparql'
) {
  let filteredSparqlQuery;
  try {
    // Get results as an array of objects
    filteredSparqlQuery = await filterSparqlQuery(query, filter, endpoint);
    const results = await construct(filteredSparqlQuery, endpoint, frame);
    return results;
  } catch (error) {
    console.error('Error executing CONSTRUCT query:', error.message, error);
    if (filteredSparqlQuery) {
      console.log('\nBad SPARQL Query: \n', filteredSparqlQuery + '\n\n');
    }
  }
}
