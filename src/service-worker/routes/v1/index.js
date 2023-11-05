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
} from '../../../library/operations/v1.js';
import { forwardFilteredRequest } from './utils/forward-filtered-request.js';
import { getSpatialPlacement } from './utils/get-spatial-placement.js';

function routes(app) {
  return app
    .get('/api/v1/technology-names', forwardFilteredRequest(getDatasetTechnologyNames))
    .get('/api/v1/provider-names', forwardFilteredRequest(getTissueProviderNames))
    .get('/api/v1/tissue-provider-names', forwardFilteredRequest(getTissueProviderNames))
    .get('/api/v1/ontology-term-occurences', forwardFilteredRequest(getOntologyTermOccurences))
    .get('/api/v1/cell-type-term-occurences', forwardFilteredRequest(getCellTypeTermOccurences))
    .get('/api/v1/tissue-blocks', forwardFilteredRequest(getTissueBlocks))
    .get('/api/v1/reference-organs', forwardFilteredRequest(getReferenceOrgans))
    .get('/api/v1/ontology-tree-model', forwardFilteredRequest(getOntologyTreeModel))
    .get('/api/v1/cell-type-tree-model', forwardFilteredRequest(getCellTypeTreeModel))
    .get('/api/v1/rui-locations', forwardFilteredRequest(getRuiLocations))
    .get('/api/v1/aggregate-results', forwardFilteredRequest(getAggregateResults))
    .get('/api/v1/db-status', forwardFilteredRequest(getDbStatus))
    .get('/api/v1/hubmap-rui-locations', forwardFilteredRequest(getHubmapRuiLocations))
    .get('/api/v1/gtex-rui-locations', forwardFilteredRequest(getGtexRuiLocations))
    .get('/api/v1/hubmap/rui_locations.jsonld', forwardFilteredRequest(getHubmapRuiLocations))
    .get('/api/v1/gtex/rui_locations.jsonld', forwardFilteredRequest(getGtexRuiLocations))
    .get('/api/v1/reference-organ-scene', forwardFilteredRequest(getReferenceOrganScene))
    .get('/api/v1/scene', forwardFilteredRequest(getScene))
    .post('/get-spatial-placement', getSpatialPlacement())
    .get('/api/v1/biomarker-tree-model', forwardFilteredRequest(getBiomarkerTreeModel))
    .get('/api/v1/biomarker-term-occurences', forwardFilteredRequest(getBiomarkerTermOccurences));
}

export default routes;