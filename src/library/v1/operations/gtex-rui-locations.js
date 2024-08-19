import { getDsGraph } from './ds-graph.js';

/**
 * Retrieves GTEx RUI locations
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to GTEx RUI location data
 */
export async function getGtexRuiLocations(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return getDsGraph({ ...filter, consortiums: ['GTEx'] }, endpoint);
}
