import {
  getCellSummary,
  getSimilarCellSourcesReport,
  getSupportedOrgans,
  getSupportedReferenceOrgans,
  getSupportedTools,
} from '../../library/operations/hra-pop.js';
import { getJsonBody, handler } from '../utils/request.js';

function routes(app) {
  return app
    .get(
      '/api/hra-pop/supported-organs',
      handler(async (_req, res) => res.json(await getSupportedOrgans(SPARQL_ENDPOINT)))
    )
    .get(
      '/api/hra-pop/supported-reference-organs',
      handler(async (_req, res) => res.json(await getSupportedReferenceOrgans(SPARQL_ENDPOINT)))
    )
    .get(
      '/api/hra-pop/supported-tools',
      handler(async (_req, res) => res.json(await getSupportedTools(SPARQL_ENDPOINT)))
    )
    .post(
      '/api/hra-pop/rui-location-cell-summary',
      handler(async (req, res) => {
        const ruiLocation = await getJsonBody(req);
        if (ruiLocation?.['@type'] !== 'SpatialEntity') {
          res.text('Must provide a rui_location in the request body', { status: 400 });
          return;
        }
        res.json(await getCellSummary(ruiLocation, SPARQL_ENDPOINT));
      })
    )
    .post(
      '/api/hra-pop/cell-summary-report',
      handler(async (req, res) => {
        const { csvString, organ, tool } = (await getJsonBody(req)) ?? {};
        if (typeof csvString !== 'string') {
          res.text('Must provide a csvString in the request body', { status: 400 });
          return;
        }
        res.json(await getSimilarCellSourcesReport(csvString, organ, tool, SPARQL_ENDPOINT));
      })
    );
}

export default routes;
