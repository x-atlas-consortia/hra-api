import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

// Define the proxy middleware for Grlc requests
const proxyOptions = {
  target: 'https://grlc.io/api-git/hubmapconsortium/ccf-grlc/subdir/',
  changeOrigin: true,
  pathRewrite: (path) => {
    return path.replace(/\/.*grlc\//g, '');
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
  onError(err, _req, res) {
    console.error(err);
    res.status(500).send('Proxy Error');
  },
  timeout: 60000,
};

const grlcProxy = createProxyMiddleware('/grlc/', proxyOptions);

export default grlcProxy;
