import { createSessionToken } from '../../../../library/v1/operations/session-token.js';
import { isWritable, sparqlEndpoint } from '../../../environment.js';

export function getSessionTokenHandler() {
  return async (req, res, _next) => {
    const { dataSources, filter } = req.body;

    if (!isWritable() || (!dataSources && !filter)) {
      res.json({ token: '' }); // Use the default dataset graph
      return;
    }

    try {
      const token = await createSessionToken(req.body, sparqlEndpoint());
      res.json(token);
    } catch (err) {
      res.status(500).json({
        error: `Error creating a session token: ${err.message}`,
      });
    }
  };
}
