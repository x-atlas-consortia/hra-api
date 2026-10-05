import { handler } from '../../../utils/request.js';

/**
 * Creates a route handler that forwards the request to the same route of the HRA API (API_ENDPOINT).
 *
 * @param {string} route - The route, e.g., 'ontology-tree-model'
 * @returns {Function} A route handler
 */
export function forwardToApi(route) {
  return handler(async (req, res) => {
    const url = new URL(`${API_ENDPOINT.replace(/\/$/, '')}/v1/${route}`);
    url.search = new URL(req.url).search;
    const resp = await fetch(url);
    res.send(await resp.arrayBuffer(), {
      type: resp.headers.get('content-type') ?? 'application/json',
      status: resp.status,
    });
  });
}
