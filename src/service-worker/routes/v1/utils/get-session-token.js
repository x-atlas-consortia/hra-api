import { handler } from '../../../utils/request.js';

/**
 * Creates a route handler for session tokens. The service worker cannot create datasets (it only reads from the
 * SPARQL endpoint), so it always returns the empty token, i.e., the default dataset (as a read-only server does).
 */
export function getSessionTokenHandler() {
  return handler(async (_req, res) => {
    res.json({ token: '' });
  });
}
