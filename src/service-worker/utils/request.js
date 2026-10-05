import qs from 'qs';

/**
 * Parses the query string of a request like the server does (see src/server/app.js): dotted keys become objects,
 * and JSON encoded strings (e.g., from the angular client) are decoded.
 *
 * @param {Request} req - The request
 * @returns {object} The parsed query parameters
 */
export function getQuery(req) {
  const searchParams = new URL(req.url).searchParams.toString();
  const query = qs.parse(searchParams, { allowDots: true });
  for (const key in query) {
    const value = query[key];
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      try {
        query[key] = JSON.parse(value);
      } catch {}
    }
  }
  return query;
}

/**
 * Reads a JSON request body
 *
 * @param {Request} req - The request
 * @returns {Promise<any>} The parsed body or undefined if it is missing or not JSON
 */
export async function getJsonBody(req) {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

/**
 * Wraps a route handler so that unexpected errors are reported as 500 responses (as on the server)
 *
 * @param {Function} fn - The route handler: (req, res) => Promise
 * @returns {Function} The wrapped route handler
 */
export function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error('Error handling', req.method, req.url, error);
      res.text('Internal Server Error', { status: 500 });
    }
  };
}
