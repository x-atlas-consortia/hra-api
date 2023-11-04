function routes(app) {
  return app
    .post('/api/ctpop/rui-location-cell-summary', async function (req, res) {
      const ruiLocation = await req.json();
      const summary = await getCellSummary(ruiLocation);
      res.json(summary);
    })
    .post('/api/ctpop/cell-summary-rui-location', async function (req, res) {
      const cellSummarySheet = await req.text();
      const report = await getSimilarCellSourcesReport(cellSummarySheet);
      res.json(report);
    });
}

export default routes;
