import { Router } from 'express';
import {
  atlasD2kRegistrations,
  gtexRegistrations,
  hubmapRegistrations,
  sennetRegistrations,
} from '../../library/operations/ds-graph.js';
import { longCache } from '../cache-middleware.js';
import { forwardFilteredRequest } from './v1/utils/forward-filtered-request.js';

const routes = Router()
  .get('/atlas-d2k/rui_locations.jsonld', longCache, forwardFilteredRequest(atlasD2kRegistrations))
  .get('/gtex/rui_locations.jsonld', longCache, forwardFilteredRequest(gtexRegistrations))
  .get('/hubmap/rui_locations.jsonld', longCache, forwardFilteredRequest(hubmapRegistrations))
  .get('/sennet/rui_locations.jsonld', longCache, forwardFilteredRequest(sennetRegistrations));

export default routes;
