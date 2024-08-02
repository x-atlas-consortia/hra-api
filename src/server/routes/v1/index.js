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
  getRuiReferenceData,
  getScene,
  getTissueBlocks,
  getTissueProviderNames,
} from '../../../library/operations/v1.js';
import { fileCache, longCache, noCache, shortCache } from '../../cache-middleware.js';
import { forwardFilteredRequest } from './utils/forward-filtered-request.js';
import { getExtractionSiteHandler } from './utils/get-extraction-site.js';
import { getSessionTokenHandler } from './utils/get-session-token.js';
import { getSpatialPlacementHandler } from './utils/get-spatial-placement.js';
import { getReferenceOrganSceneHandler } from './utils/reference-organ-scene.js';

const routes = Router()
  .get('/technology-names', shortCache, forwardFilteredRequest(getDatasetTechnologyNames))
  .get('/provider-names', shortCache, forwardFilteredRequest(getTissueProviderNames))
  .get('/tissue-provider-names', shortCache, forwardFilteredRequest(getTissueProviderNames))
  .get('/ontology-term-occurences', shortCache, forwardFilteredRequest(getOntologyTermOccurences))
  .get('/cell-type-term-occurences', shortCache, forwardFilteredRequest(getCellTypeTermOccurences))
  .get('/tissue-blocks', shortCache, forwardFilteredRequest(getTissueBlocks))
  .get('/reference-organs', longCache, fileCache('reference-organs.json'), forwardFilteredRequest(getReferenceOrgans))
  .get(
    '/ontology-tree-model',
    longCache,
    fileCache('ontology-tree-model.json'),
    forwardFilteredRequest(getOntologyTreeModel)
  )
  .get(
    '/cell-type-tree-model',
    longCache,
    fileCache('cell-type-tree-model.json'),
    forwardFilteredRequest(getCellTypeTreeModel)
  )
  .get('/rui-locations', shortCache, forwardFilteredRequest(getRuiLocations))
  .get('/aggregate-results', shortCache, forwardFilteredRequest(getAggregateResults))
  .get('/db-status', noCache, forwardFilteredRequest(getDbStatus))
  .get('/hubmap-rui-locations', shortCache, forwardFilteredRequest(getHubmapRuiLocations))
  .get('/gtex-rui-locations', shortCache, forwardFilteredRequest(getGtexRuiLocations))
  .get('/hubmap/rui_locations.jsonld', shortCache, forwardFilteredRequest(getHubmapRuiLocations))
  .get('/gtex/rui_locations.jsonld', shortCache, forwardFilteredRequest(getGtexRuiLocations))
  .get('/reference-organ-scene', shortCache, getReferenceOrganSceneHandler())
  .get('/scene', shortCache, forwardFilteredRequest(getScene))
  .post('/session-token', noCache, getSessionTokenHandler())
  .post('/get-spatial-placement', noCache, getSpatialPlacementHandler())
  .get(
    '/biomarker-tree-model',
    longCache,
    fileCache('biomarker-tree-model.json'),
    forwardFilteredRequest(getBiomarkerTreeModel)
  )
  .get('/biomarker-term-occurences', shortCache, forwardFilteredRequest(getBiomarkerTermOccurences))
  .get(
    '/anatomical-systems-tree-model',
    longCache,
    fileCache('anatomical-systems-tree-model.json'),
    forwardFilteredRequest(getAnatomicalSystemsTreeModel)
  )
  .get(
    '/rui-reference-data',
    longCache,
    fileCache('rui-reference-data.json'),
    forwardFilteredRequest(getRuiReferenceData)
  )
  .get('/extraction-site', noCache, getExtractionSiteHandler());

export default routes;
