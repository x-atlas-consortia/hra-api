import { queryParametersToFilter } from '../../../../library/v1/utils/parse-filter.js';
import { getQuery, handler } from '../../../utils/request.js';

/**
 * Creates a route handler that runs an operation with the filter given in the query parameters.
 *
 * @param {Function} method - The operation: (filter, endpoint) => Promise
 * @returns {Function} A route handler
 */
export function forwardFilteredRequest(method) {
  return handler(async (req, res) => {
    const filter = queryParametersToFilter(getQuery(req));
    const result = await method(filter, SPARQL_ENDPOINT);
    res.json(result);
  });
}
