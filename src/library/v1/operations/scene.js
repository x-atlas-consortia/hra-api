/**
 * Retrieves scene data
 * @param {Object} filter - An object containing query filters (unused)
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Array} - An empty array as scene data
 */
export async function getScene(_filter, _endpoint = 'https://lod.humanatlas.io/sparql') {
  try {
    const results = [];
    return results;
  } catch (error) {
    console.error('Error executing SPARQL query:', error.message);
  }
}
