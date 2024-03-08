import { Router } from 'express';
import {
  getAggregateResults,
  getAnatomicalSystemsTreeModel,
  getBiomarkerTermOccurences,
  getBiomarkerTreeModel,
  getCellTypeTermOccurences,
  getCellTypeTreeModel,
  getDatasetTechnologyNames,
  getDbStatus,
  getGtexRuiLocations,
  getHubmapRuiLocations,
  getOntologyTermOccurences,
  getOntologyTreeModel,
  getReferenceOrgans,
  getRuiLocations,
  getScene,
  getTissueBlocks,
  getTissueProviderNames,
} from '../../../library/operations/v1.js';
import { forwardFilteredRequest } from './utils/forward-filtered-request.js';
import { getSpatialPlacementHandler } from './utils/get-spatial-placement.js';
import { getReferenceOrganSceneHandler } from './utils/reference-organ-scene.js';
import { longCache, noCache, shortCache } from '../../cache-middleware.js';

const routes = Router()
  .get('/technology-names', shortCache, forwardFilteredRequest(getDatasetTechnologyNames))
  .get('/provider-names', shortCache, forwardFilteredRequest(getTissueProviderNames))
  .get('/tissue-provider-names', shortCache, forwardFilteredRequest(getTissueProviderNames))
  .get('/ontology-term-occurences', shortCache, forwardFilteredRequest(getOntologyTermOccurences))
  .get('/cell-type-term-occurences', shortCache, forwardFilteredRequest(getCellTypeTermOccurences))
  .get('/tissue-blocks', shortCache, forwardFilteredRequest(getTissueBlocks))
  .get('/reference-organs', longCache, forwardFilteredRequest(getReferenceOrgans))
  .get('/ontology-tree-model', longCache, forwardFilteredRequest(getOntologyTreeModel))
  .get('/cell-type-tree-model', longCache, forwardFilteredRequest(getCellTypeTreeModel))
  .get('/rui-locations', shortCache, forwardFilteredRequest(getRuiLocations))
  .get('/aggregate-results', shortCache, forwardFilteredRequest(getAggregateResults))
  .get('/db-status', longCache, forwardFilteredRequest(getDbStatus))
  .get('/hubmap-rui-locations', shortCache, forwardFilteredRequest(getHubmapRuiLocations))
  .get('/gtex-rui-locations', shortCache, forwardFilteredRequest(getGtexRuiLocations))
  .get('/hubmap/rui_locations.jsonld', shortCache, forwardFilteredRequest(getHubmapRuiLocations))
  .get('/gtex/rui_locations.jsonld', shortCache, forwardFilteredRequest(getGtexRuiLocations))
  .get('/reference-organ-scene', shortCache, getReferenceOrganSceneHandler())
  .get('/scene', shortCache, forwardFilteredRequest(getScene))
  .post('/get-spatial-placement', noCache, getSpatialPlacementHandler())
  .get('/biomarker-tree-model', longCache, forwardFilteredRequest(getBiomarkerTreeModel))
  .get('/biomarker-term-occurences', shortCache, forwardFilteredRequest(getBiomarkerTermOccurences))
  .get('/anatomical-systems-tree-model', longCache, forwardFilteredRequest(getAnatomicalSystemsTreeModel));

export default routes;
