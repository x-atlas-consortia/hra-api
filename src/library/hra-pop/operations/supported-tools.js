import { select } from '../../shared/utils/sparql';
import query from '../queries/supported-tools.rq';

/**
 * Get all tools supported by HRApop
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Array>} - A promise that resolves to an array of organ iris and labels
 */
export async function getSupportedTools(endpoint = 'https://lod.humanatlas.io/sparql') {
  return select(query, endpoint);
}
