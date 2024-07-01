import cors from 'cors';
import express from 'express';
import queue from 'express-queue';
import helmet from 'helmet';
import qs from 'qs';
import { longCache, noCache } from './cache-middleware.js';
import { activeQueryLimit } from './environment.js';
import './fetch-polyfill.js';
import browserRoute from './routes/browser.js';
import dsGraphRoutes from './routes/ds-graph.js';
import euiRoute from './routes/eui.js';
import hraPopRoutes from './routes/hra-pop.js';
import ruiRoute from './routes/rui.js';
import sparqlRoute from './routes/sparql.js';
import v1Routes from './routes/v1';

const app = express();

app.set('query parser', function (str) {
  return qs.parse(str, { allowDots: true });
});

// http://expressjs.com/en/advanced/best-practice-security.html
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'base-uri': ["'self'", 'cdn.humanatlas.io', 'cdn.jsdelivr.net'],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'cdn.humanatlas.io',
          'cdn.jsdelivr.net',
          'unpkg.com',
          'www.googletagmanager.com',
        ],
        'img-src': [
          "'self'",
          "'unsafe-eval'",
          'cdn.humanatlas.io',
          'cdn.jsdelivr.net',
          'unpkg.com',
          'www.googletagmanager.com',
        ],
        'connect-src': ['*'],
      },
    },
  })
);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: ['text/*', 'application/sparql-query'] }));
app.use(express.json());
app.set('json spaces', 2);

app.use('/', longCache, browserRoute);
app.use('/', longCache, euiRoute);
app.use('/', longCache, ruiRoute);

const processingQueue = queue({ activeLimit: activeQueryLimit(), queuedLimit: -1 });
app.use('/v1', processingQueue, v1Routes);
app.use('/v1/sparql', noCache, sparqlRoute);
app.use('/hra-pop', processingQueue, hraPopRoutes);
app.use('/ds-graph', dsGraphRoutes);

// app.use(function (err, req, res, next) {
//   const debugMode = req.app.get('env') === 'development';

//   res.status(err.status || 500);

//   if (debugMode) {
//     res.json(err);
//   } else {
//     res.json({ message: 'error' });
//   }
// });

export default app;
