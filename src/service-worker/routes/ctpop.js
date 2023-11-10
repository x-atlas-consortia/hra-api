import { getCellSummary, getSimilarCellSourcesReport, getSupportedOrgans } from '../../library/operations/ctpop.js';

function routes(app) {
  return app
    .get('/supported-organs', async function (_req, res) {
      const organs = await getSupportedOrgans();
      res.json(organs);
    })
    .post('/api/ctpop/rui-location-cell-summary', async function (req, res) {
      const ruiLocation = await req.json();
      const summary = await getCellSummary(ruiLocation);
      res.json(summary);
    })
    .post('/api/ctpop/cell-summary-report', async function (req, res) {
      const cellSummarySheet = await req.text();
      const report = await getSimilarCellSourcesReport(cellSummarySheet);
      res.json(report);
    });
}

export default routes;
