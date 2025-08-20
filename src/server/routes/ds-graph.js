import { Router } from 'express';
import {
  atlasD2kRegistrations,
  gtexRegistrations,
  hubmapRegistrations,
  sennetRegistrations,
} from '../../library/operations/ds-graph.js';
import { longCache } from '../cache-middleware.js';

function forwardFilteredRequest(method) {
  return async (req, res) => {
    try {
      const { query } = req;
      const token = query.token ?? undefined;
      const primaryOnly = query.primary === 'true';
      const result = await method(token, primaryOnly);
      res.json(result);
    } catch (error) {
      // Handle errors here
      console.error('Error:', error.message);
      res.status(500).send('Internal Server Error');
    }
  };
}

const routes = Router()
  .get('/atlas-d2k', longCache, forwardFilteredRequest(atlasD2kRegistrations))
  .get('/gtex', longCache, forwardFilteredRequest(gtexRegistrations))
  .get('/hubmap', longCache, forwardFilteredRequest(hubmapRegistrations))
  .get('/sennet', longCache, forwardFilteredRequest(sennetRegistrations));

export default routes;
