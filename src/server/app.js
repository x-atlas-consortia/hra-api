import express from 'express';
import qs from 'qs';
import browserRoute from './routes/browser.js';
import euiRoute from './routes/eui.js';
import sparqlProxy from './routes/sparql.js';
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
app.use('/v1/sparql', sparqlProxy);

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
