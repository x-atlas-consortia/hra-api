import { Router } from 'express';
import {
  getAggregateResults,
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
  getReferenceOrganScene,
  getReferenceOrgans,
  getRuiLocations,
  getScene,
  getTissueBlocks,
  getTissueProviderNames,
} from '../../../library/v1';
import { forwardFilteredRequest } from './utils/forward-filtered-request.js';
import { getSpatialPlacement } from './utils/get-spatial-placement.js';

const routes = Router()
  .get('/technology-names', forwardFilteredRequest(getDatasetTechnologyNames))
  .get('/provider-names', forwardFilteredRequest(getTissueProviderNames))
  .get('/tissue-provider-names', forwardFilteredRequest(getTissueProviderNames))
  .get('/ontology-term-occurences', forwardFilteredRequest(getOntologyTermOccurences))
  .get('/cell-type-term-occurences', forwardFilteredRequest(getCellTypeTermOccurences))
  .get('/tissue-blocks', forwardFilteredRequest(getTissueBlocks))
  .get('/reference-organs', forwardFilteredRequest(getReferenceOrgans))
  .get('/ontology-tree-model', forwardFilteredRequest(getOntologyTreeModel))
  .get('/cell-type-tree-model', forwardFilteredRequest(getCellTypeTreeModel))
  .get('/rui-locations', forwardFilteredRequest(getRuiLocations))
  .get('/aggregate-results', forwardFilteredRequest(getAggregateResults))
  .get('/db-status', forwardFilteredRequest(getDbStatus))
  .get('/hubmap-rui-locations', forwardFilteredRequest(getHubmapRuiLocations))
  .get('/gtex-rui-locations', forwardFilteredRequest(getGtexRuiLocations))
  .get('/hubmap/rui_locations.jsonld', forwardFilteredRequest(getHubmapRuiLocations))
  .get('/gtex/rui_locations.jsonld', forwardFilteredRequest(getGtexRuiLocations))
  .get('/reference-organ-scene', forwardFilteredRequest(getReferenceOrganScene))
  .get('/scene', forwardFilteredRequest(getScene))
  .post('/get-spatial-placement', getSpatialPlacement())
  .get('/biomarker-tree-model', forwardFilteredRequest(getBiomarkerTreeModel))
  .get('/biomarker-term-occurences', forwardFilteredRequest(getBiomarkerTermOccurences));

export default routes;
