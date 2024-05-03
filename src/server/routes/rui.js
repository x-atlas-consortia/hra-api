import { Router } from 'express';

const ruiRoute = (_req, res, _next) => {
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Human Reference Atlas Registration User Interface (RUI)</title>
  <base href="https://cdn.humanatlas.io/ui--staging/ccf-rui/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
  <link href="styles.css" rel="stylesheet">
  <script src="wc.js" async></script>
</head>
<body>
  <ccf-rui collisions-endpoint="" base-href="https://cdn.humanatlas.io/ui--staging/ccf-rui/"></ccf-rui>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const rui = document.querySelector('ccf-rui');
      const thisPage = location.pathname.replace(/\\/[^\\/]+$/, '/');
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
