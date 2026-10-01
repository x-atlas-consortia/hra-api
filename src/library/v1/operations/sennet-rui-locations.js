import { getDsGraph } from './ds-graph.js';

/**
 * Retrieves SenNet RUI locations
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to SenNet RUI location data
 */
export async function getSennetRuiLocations(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return getDsGraph({ ...filter, consortiums: ['SenNet'] }, endpoint);
}
