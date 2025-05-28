import { Router } from 'express';

const euiRoute = (req, res, _next) => {
  const token = req.query.token ?? '';
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Human Reference Atlas Exploration User Interface (EUI)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/png" href="favicon.png" />

  <base href="https://cdn.humanatlas.io/ui--staging/ccf-eui/" />
  <link href="https://cdn.humanatlas.io/ui--staging/ccf-eui/styles.css" rel="stylesheet" />
  <script src="https://cdn.humanatlas.io/ui--staging/ccf-eui/wc.js" type="module"></script>
</head>
<body>
  <ccf-eui token="${token}" login-disabled="true" logo-tooltip=""></ccf-eui>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const eui = document.querySelector('ccf-eui');
      eui.homeUrl = location.href;
      // Set the remote api endpoint to the "this server"
      eui.remoteApiEndpoint = new URL(location.pathname.replace(/\\/[^\\/]+$/, '/') + '../', location.origin).toString().replace(/\\/$/,'');
    });
  </script>
</body>
</html>
  `);
};

const routes = Router().get('/eui/', euiRoute).get('/eui/index.html', euiRoute);

export default routes;
