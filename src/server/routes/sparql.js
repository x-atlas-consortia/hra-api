import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

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

export default sparqlProxy;
