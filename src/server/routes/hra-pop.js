import { Router } from 'express';
import {
  getCellSummary,
  getSimilarCellSourcesReport,
  getSupportedOrgans,
  getSupportedReferenceOrgans,
  getSupportedTools,
} from '../../library/operations/hra-pop.js';
import { longCache, noCache } from '../cache-middleware.js';

const routes = Router()
  .get('/supported-organs', longCache, async function (_req, res) {
    const organs = await getSupportedOrgans();
    res.json(organs);
  })
  .get('/supported-reference-organs', longCache, async function (_req, res) {
    const organs = await getSupportedReferenceOrgans();
    res.json(organs);
  })
  .get('/supported-tools', longCache, async function (_req, res) {
    const tools = await getSupportedTools();
    res.json(tools);
  })
  .post('/rui-location-cell-summary', noCache, async function (req, res) {
    const ruiLocation = req.body;
    const summary = await getCellSummary(ruiLocation);
    res.json(summary);
  })
  .post('/cell-summary-report', noCache, async function (req, res) {
    const cellSummarySheet = req.body.csvString;
    const organ = req.body.organ;
    const report = await getSimilarCellSourcesReport(cellSummarySheet, organ);
    res.json(report);
  });

export default routes;
