import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import qs from 'qs';
import { longCache, noCache } from './cache-middleware.js';
import browserRoute from './routes/browser.js';
import euiRoute from './routes/eui.js';
import hraPopRoutes from './routes/hra-pop.js';
import sparqlProxy from './routes/sparql.js';
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
        'base-uri': ["'self'", 'cdn.jsdelivr.net'],
        'script-src': ["'self'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'unpkg.com', 'www.googletagmanager.com'],
        'img-src': ["'self'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'unpkg.com', 'www.googletagmanager.com'],
        'connect-src': ['*'],
      },
    },
  })
);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: 'text/*' }));
app.use(express.json());
app.set('json spaces', 2);

app.use('/', longCache, browserRoute);
app.use('/', longCache, euiRoute);
app.use('/v1', v1Routes);
app.use('/v1/sparql', noCache, sparqlProxy);
app.use('/hra-pop', hraPopRoutes);

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
