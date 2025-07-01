import { Router } from 'express';
import { doSearch, getDigitalObjects } from '../../library/operations/hra-kg.js';
import { fileCache, longCache } from '../cache-middleware.js';
import { forwardFilteredRequest } from './v1/utils/forward-filtered-request.js';

const routes = Router()
  .get('/do-search', longCache, forwardFilteredRequest(doSearch))
  .get('/digital-objects', longCache, fileCache('digital-objects.json'), async function (_req, res) {
    const digitalObjects = await getDigitalObjects();
    res.json(digitalObjects);
  });

export default routes;
