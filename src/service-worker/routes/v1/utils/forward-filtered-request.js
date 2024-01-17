import { queryParametersToFilter } from '../../../../library/v1/utils/parse-filter.js';

/**
 * Creates an Express middleware function that forwards a SPARQL query based on a provided method.
 *
 * @param {Function} method - The method to execute the SPARQL query.
 * @returns {Function} An Express middleware function.
 */
export function forwardFilteredRequest(method) {
  return async (req, res) => {
    try {
      const { query } = req;
      const filter = queryParametersToFilter(query);
      const result = await method(filter, SPARQL_ENDPOINT);
      res.json(result);
    } catch (error) {
      // Handle errors here
      console.error('Error:', error.message);
      res.status(500).send('Internal Server Error');
    }
  };
}
