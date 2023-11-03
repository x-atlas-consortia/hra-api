import express from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import qs from 'qs';
import browserRoute from './routes/browser.js';
import euiRoute from './routes/eui.js';
import v1Routes from './routes/v1/index.js';

const app = express();

app.use(express.json());
app.set('json spaces', 2);

app.set('query parser', function (str) {
  return qs.parse(str, { allowDots: true });
});

app.use('/', browserRoute);
app.use('/', euiRoute);
app.use('/v1', v1Routes);

// Define the proxy middleware for SPARQL requests
const proxyOptions = {
  target: 'https://lod.humanatlas.io/sparql',
  changeOrigin: true,
  pathRewrite: (path) => {
    const params = new URL(path, 'http://localhost').searchParams;
    if (params.has('format')) {
      params.delete('format');
    }
    return `?${params.toString()}`;
  },
  onProxyReq: (proxyReq, req) => {
    if (req.query.format) {
      proxyReq.setHeader('accept', req.query.format);
    }
    if (req.method === 'POST') {
      proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
      fixRequestBody(proxyReq, req);
    }
  },
  onError(err, req, res) {
    console.error(err);
    res.status(500).send('Proxy Error');
  },
  timeout: 90000,
};

const sparqlProxy = createProxyMiddleware('/v1/sparql', proxyOptions);
app.use('/v1/sparql', sparqlProxy);

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});

export default app;
