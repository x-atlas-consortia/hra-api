import { Router } from 'express';
import { getCellSummary, getSimilarCellSourcesReport, getSupportedOrgans, getSupportedReferenceOrgans } from '../../library/operations/ctpop.js';

const routes = Router()
  .get('/supported-organs', async function (_req, res) {
    const organs = await getSupportedOrgans();
    res.json(organs);
  })
  .get('/supported-reference-organs', async function (_req, res) {
    const organs = await getSupportedReferenceOrgans();
    res.json(organs);
  })
  .post('/rui-location-cell-summary', async function (req, res) {
    const ruiLocation = req.body;
    const summary = await getCellSummary(ruiLocation);
    res.json(summary);
  })
  .post('/cell-summary-report', async function (req, res) {
    const cellSummarySheet = req.body.csvString;
    const organ = req.body.organ;
    const report = await getSimilarCellSourcesReport(cellSummarySheet, organ);
    res.json(report);
  });

export default routes;
