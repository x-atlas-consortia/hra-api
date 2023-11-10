import { select } from '../../shared/utils/sparql';
import query from '../queries/supported-organs.rq';

/**
 * Get all organs supported by HRApop (Paper Version)
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Array>} - A promise that resolves to an array of organ iris and labels
 */
export async function getSupportedOrgans(endpoint = 'https://lod.humanatlas.io/sparql') {
  return select(query, endpoint);
}
