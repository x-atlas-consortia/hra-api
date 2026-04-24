import { Router } from 'express';
import { getAbsoluteUrl } from '../utils/absolute-url.js';

const ftuExplorerRoute = (req, res, _next) => {
  const url = getAbsoluteUrl(req);
  const illustrationsUrl = url.slice(0, url.indexOf('/ftu-explorer')) + '/v1/ftu-illustrations';
  const baseHref = url.slice(0, url.indexOf('/ftu-explorer')) + '/ftu-explorer/';
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Human Reference Atlas FTU Explorer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/png" href="favicon.png" />

  <link rel="preconnect" href="https://fonts.gstatic.com" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
  />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

  <base href="${baseHref}" />
  <link href="https://cdn.humanatlas.io/ui--staging/ftu-ui/styles.css" rel="stylesheet" />
  <script src="https://cdn.humanatlas.io/ui--staging/ftu-ui/wc.js" type="module"></script>
</head>
<body>
  <hra-ftu-ui
    illustrations="${illustrationsUrl}"
    base-href="https://cdn.humanatlas.io/ui--staging/ftu-ui/"
    datasets="https://cdn.humanatlas.io/ui/ftu-ui/assets/TEMP/ftu-datasets.jsonld"
    summaries="https://cdn.humanatlas.io/ui/ftu-ui/assets/TEMP/ftu-cell-summaries.jsonld"
  ></hra-ftu-ui>
</body>
</html>
  `);
};

const routes = Router()
  .get('/ftu-explorer', ftuExplorerRoute)
  .get('/ftu-explorer/', ftuExplorerRoute)
  .get('/ftu-explorer/index.html', ftuExplorerRoute)
  .get('/ftu-explorer/ftu', ftuExplorerRoute);

export default routes;
