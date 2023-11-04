import { Router } from 'express';
import apiSpec from '../../../hra-api-spec.yaml';

const browserRoute = (_req, res, _next) => {
  res.send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
    </head>
    <body>
      <rapi-doc
        spec-url="hra-api-spec.yaml"
        fill-request-fields-with-example="false"
        theme="light"
        show-header="false"
        render-style="view"
        layout="column"
        allow-authentication="false"
      ></rapi-doc>
    </body>
  </html>`);
};

const openApiRoute = (_req, res, _next) => {
  res.send(apiSpec, { 'Content-Type': 'application/yaml' });
};

const routes = Router().get('/', browserRoute).get('/index.html', browserRoute).get('/hra-api-spec.yaml', openApiRoute);

export default routes;
