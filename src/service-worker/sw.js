import { Wayne } from '@jcubic/wayne';
import { getCellSummary } from '../library/ctpop/operations/rui-location-cell-summary';
import { getSimilarCellSourcesReport } from '../library/ctpop/operations/cell-summary-rui-location';

// Tell the service worker to start using immediately
self.skipWaiting();

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

const app = new Wayne();

app.post('/api/ctpop/rui-location-cell-summary', async function (req, res) {
  const ruiLocation = await req.json();
  const summary = await getCellSummary(ruiLocation);
  res.json(summary);
});

app.post('/api/ctpop/cell-summary-rui-location', async function (req, res) {
  const cellSummarySheet = await req.text();
  const report = await getSimilarCellSourcesReport(cellSummarySheet);
  res.json(report);
});
