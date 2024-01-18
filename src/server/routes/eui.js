import { Router } from 'express';

const euiRoute = (_req, res, _next) => {
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>HRA Exploration User Interface</title>
  <base href="https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-ui@gh-pages/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
  <link href="styles.css" rel="stylesheet">
  <script src="wc.js" async></script>
</head>
<body>
  <ccf-eui use-remote-api="true" hubmap-data-url="" login-disabled="true" logo-tooltip=""></ccf-eui>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const eui = document.querySelector('ccf-eui');
      eui.homeUrl = location.href;
      // Set the remote api endpoint to the "this server"
      eui.remoteApiEndpoint = new URL(location.pathname.replace(/\\/[^\\/]+$/, '/') + '../v1', location.origin).toString();
    });
  </script>
</body>
</html>
  `);
};

const routes = Router().get('/eui/', euiRoute).get('/eui/index.html', euiRoute);

export default routes;
