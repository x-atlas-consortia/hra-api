import { getCellSummary, getSimilarCellSourcesReport, getSupportedOrgans, getSupportedReferenceOrgans } from '../../library/operations/hra-pop.js';

function routes(app) {
  return app
    .get('/api/hra-pop/supported-organs', async function (_req, res) {
      const organs = await getSupportedOrgans();
      res.json(organs);
    })
    .get('/api/hra-pop/supported-reference-organs', async function (_req, res) {
      const organs = await getSupportedReferenceOrgans();
      res.json(organs);
    })
    .post('/api/hra-pop/rui-location-cell-summary', async function (req, res) {
      const ruiLocation = await req.json();
      const summary = await getCellSummary(ruiLocation);
      res.json(summary);
    })
    .post('/api/hra-pop/cell-summary-report', async function (req, res) {
      const cellSummarySheet = await req.text();
      const report = await getSimilarCellSourcesReport(cellSummarySheet);
      res.json(report);
    });
}

export default routes;
