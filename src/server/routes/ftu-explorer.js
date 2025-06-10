import { Router } from 'express';

const ftuExplorerRoute = (_req, res, _next) => {
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

  <base href="https://cdn.humanatlas.io/ui--staging/ftu-ui/" />
  <link href="https://cdn.humanatlas.io/ui--staging/ftu-ui/styles.css" rel="stylesheet" />
  <script src="https://cdn.humanatlas.io/ui--staging/ftu-ui/wc.js" type="module"></script>
</head>
<body>
  <hra-ftu-ui
    datasets="https://cdn.humanatlas.io/ui/ftu-ui/assets/TEMP/ftu-datasets.jsonld"
    summaries="https://cdn.humanatlas.io/ui/ftu-ui/assets/TEMP/ftu-cell-summaries.jsonld"
  ></hra-ftu-ui>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const ftu = document.querySelector('hra-ftu-ui');
      ftu.homeUrl = location.href;
      // Set the remote api endpoint to the "this server"
      const server = new URL(location.pathname.replace(/\\/[^\\/]+$/, '/') + '../', location.origin).toString().replace(/\\/$/,'');
      ftu.illustrations = server + '/v1/ftu-illustrations';
    });
  </script>
</body>
</html>
  `);
};

const routes = Router().get('/ftu-explorer/', ftuExplorerRoute).get('/ftu-explorer/index.html', ftuExplorerRoute);

export default routes;
