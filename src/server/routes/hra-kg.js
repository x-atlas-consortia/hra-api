import { Router } from 'express';
import { getDigitalObjects } from '../../library/operations/hra-kg.js';
import { fileCache, longCache } from '../cache-middleware.js';

const routes = Router().get(
  '/digital-objects',
  longCache,
  fileCache('digital-objects.json'),
  async function (_req, res) {
    const digitalObjects = await getDigitalObjects();
    res.json(digitalObjects);
  }
);

export default routes;
