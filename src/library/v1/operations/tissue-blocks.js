import query from '../queries/tissue-blocks.rq';
import frame from '../frames/tissue-blocks.jsonld';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';

/**
 * Retrieves tissue blocks
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to tissue block data
 */
export async function getTissueBlocks(filter) {
  return await executeFilteredConstructQuery(query, filter, frame, endpoint);
}
