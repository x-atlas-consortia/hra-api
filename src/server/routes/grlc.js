import { Router } from 'express';
import { getGrlcSpec } from '../../library/grlc/grlc-spec.js';
import { longCache } from '../cache-middleware.js';

function grlcHtml(name) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
    </head>
    <body>
      <rapi-doc
        spec-url="${name}-spec.json"
        fill-request-fields-with-example="false"
        show-header="false"
        render-style="view"
        layout="column"
        allow-authentication="false"
        theme="light"
        bg-color="#E6EAF0"
        text-color="#201E3D"
        header-color="#201E3D"
        primary-color="#FF0043"
      ></rapi-doc>
    </body>
  </html>`;
}

const grlcRoute = (req, res, _next) => {
  res.send(grlcHtml(req.params.name));
};

function staticGrlcRoute(name) {
  return (_req, res, _next) => {
    res.send(grlcHtml(name));
  };
}

const grlcSpecRoute = async (req, res, _next) => {
  const spec = await getGrlcSpec(req.params.name);
  res.json(spec);
};

const routes = Router()
  .get('/grlc/', staticGrlcRoute('index'))
  .get('/grlc', staticGrlcRoute('grlc/index'))
  .get('/grlc/:name.html', grlcRoute)
  .get('/grlc/:name-spec.json', longCache, grlcSpecRoute);

export default routes;
