import { Router } from 'express';
import { getCellSummary, getSimilarCellSourcesReport } from '../../library/ctpop';

const routes = Router()
  .post('/rui-location-cell-summary', async function (req, res) {
    const ruiLocation = req.body;
    const summary = await getCellSummary(ruiLocation);
    res.json(summary);
  })
  .post('/cell-summary-rui-location', async function (req, res) {
    const cellSummarySheet = req.body;
    const report = await getSimilarCellSourcesReport(cellSummarySheet);
    res.json(report);
  });

export default routes;
