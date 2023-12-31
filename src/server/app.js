import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import qs from 'qs';
import browserRoute from './routes/browser.js';
import hraPopRoutes from './routes/hra-pop.js';
import euiRoute from './routes/eui.js';
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
        'script-src': ["'self'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'unpkg.com'],
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

app.use('/', browserRoute);
app.use('/', euiRoute);
app.use('/v1', v1Routes);
app.use('/v1/sparql', sparqlProxy);
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
