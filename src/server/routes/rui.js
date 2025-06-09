import { Router } from 'express';

const ruiRoute = (_req, res, _next) => {
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Human Reference Atlas Registration User Interface (RUI)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/png" href="favicon.png" />

  <base href="https://cdn.humanatlas.io/ui--staging/ccf-rui/" />
  <link href="https://cdn.humanatlas.io/ui--staging/ccf-rui/styles.css" rel="stylesheet" />
  <script src="https://cdn.humanatlas.io/ui--staging/ccf-rui/wc.js" type="module"></script>
</head>
<body>
  <ccf-rui></ccf-rui>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const rui = document.querySelector('ccf-rui');
      const thisPage = location.pathname.replace(/\\/[^\\/]+$/, '/');
      const collisionsEndpoint = new URL(thisPage + '../v1/collisions', location.origin);
      rui.collisionsEndpoint = collisionsEndpoint.toString();
      const referenceData = new URL(thisPage + '../v1/rui-reference-data', location.origin);
      rui.referenceData = referenceData.toString();
    });
  </script>
</body>
</html>
`);
};

const routes = Router().get('/rui/', ruiRoute).get('/rui/index.html', ruiRoute);

export default routes;
