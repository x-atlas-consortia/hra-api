import {
  getAggregateResults,
  getAnatomicalSystemsTreeModel,
  getASCTBOmapSheetConfig,
  getASCTBSheetConfig,
  getBiomarkerTermOccurences,
  getBiomarkerTreeModel,
  getCellTypeTermOccurences,
  getCellTypeTreeModel,
  getDatasetTechnologyNames,
  getDbStatus,
  getDsGraph,
  getFtuIllustrations,
  getGtexRuiLocations,
  getHubmapRuiLocations,
  getOntologyTermOccurences,
  getOntologyTreeModel,
  getReferenceOrgans,
  getRuiReferenceData,
  getScene,
  getTissueBlocks,
  getTissueProviderNames,
} from '../../../library/operations/v1.js';
import { forwardFilteredRequest } from './utils/forward-filtered-request.js';
import { getCollisionsHandler } from './utils/get-collisions.js';
import { getCorridorHandler } from './utils/get-corridor.js';
import { getExtractionSiteHandler } from './utils/get-extraction-site.js';
import { getMesh3dCellPopulationHandler } from './utils/get-mesh-3d-cell-population.js';
import { getSpatialPlacementHandler } from './utils/get-spatial-placement.js';
import { getReferenceOrganSceneHandler } from './utils/reference-organ-scene.js';

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
    .get('/api/v1/aggregate-results', forwardFilteredRequest(getAggregateResults))
    .get('/api/v1/db-status', forwardFilteredRequest(getDbStatus))
    .get('/api/v1/ds-graph', forwardFilteredRequest(getDsGraph))
    .get('/api/v1/hubmap-rui-locations', forwardFilteredRequest(getHubmapRuiLocations))
    .get('/api/v1/gtex-rui-locations', forwardFilteredRequest(getGtexRuiLocations))
    .get('/api/v1/hubmap/rui_locations.jsonld', forwardFilteredRequest(getHubmapRuiLocations))
    .get('/api/v1/gtex/rui_locations.jsonld', forwardFilteredRequest(getGtexRuiLocations))
    .get('/api/v1/reference-organ-scene', getReferenceOrganSceneHandler())
    .get('/api/v1/scene', forwardFilteredRequest(getScene))
    .post('/api/v1/get-spatial-placement', getSpatialPlacementHandler())
    .get('/api/v1/biomarker-tree-model', forwardFilteredRequest(getBiomarkerTreeModel))
    .get('/api/v1/biomarker-term-occurences', forwardFilteredRequest(getBiomarkerTermOccurences))
    .get('/api/v1/anatomical-systems-tree-model', forwardFilteredRequest(getAnatomicalSystemsTreeModel))
    .get('/api/v1/rui-reference-data', forwardFilteredRequest(getRuiReferenceData))
    .get('/api/v1/asctb-omap-sheet-config', forwardFilteredRequest(getASCTBOmapSheetConfig))
    .get('/api/v1/asctb-sheet-config', forwardFilteredRequest(getASCTBSheetConfig))
    .get('/api/v1/ftu-illustrations', forwardFilteredRequest(getFtuIllustrations))
    .get('/api/v1/extraction-site', getExtractionSiteHandler())
    .post('/api/v1/collisions', getCollisionsHandler())
    .post('/api/v1/corridor', getCorridorHandler())
    .post('/api/v1/mesh-3d-cell-population', getMesh3dCellPopulationHandler);
}

export default routes;
