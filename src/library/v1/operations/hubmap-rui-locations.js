import { getDsGraph } from './ds-graph.js';

/**
 * Retrieves HuBMAP RUI locations
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to HuBMAP RUI location data
 */
export async function getHubmapRuiLocations(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return getDsGraph({ ...filter, consortiums: ['HuBMAP'] }, endpoint);
}
