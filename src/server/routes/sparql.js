import { Router } from 'express';
import { fetchSparql } from '../../library/shared/utils/sparql.js';
import { exposedSparqlEndpoint } from '../environment.js';

function parseString(value) {
  return typeof value === 'string' ? value : undefined;
}

const sparql = async (req, res, _next) => {
  let queryBody;
  const format = parseString(req.query.format);
  switch (req.method) {
    case 'POST':
      if (req.is('application/sparql-query')) {
        queryBody = parseString(req.body);
      } else {
        queryBody = parseString(req.body?.query ?? '') || undefined;
      }
      break;
    case 'GET':
      queryBody = parseString(req.query.query);
      break;
  }

  if (!queryBody) {
    res.status(405).send('Unsupported operation.');
    res.end();
    return;
  }

  /** Content Negotiation */
  let mediaType = 'application/sparql-results+json';
  if (format) {
    mediaType = format;
    if (['simple', 'stats', 'table', 'tree'].includes(format)) {
      res.type('text/plain');
    } else {
      res.type(format);
    }
  } else {
    const mediaTypes = [
      'application/json',
      'application/ld+json',
      'application/n-quads',
      'application/n-triples',
      'application/rdf+xml',
      'application/sparql-results+json',
      'application/sparql-results+xml',
      'application/trig',
      'text/csv',
      'text/n3',
      'text/tab-separated-values',
      'text/turtle',
      'text/plain',
    ].reduce((acc, type) => {
      acc[type] = () => {
        mediaType = type;
      };
      return acc;
    }, {});
    res.format(mediaTypes);
  }

  const results = await fetchSparql(queryBody, exposedSparqlEndpoint(), mediaType);
  for await (const chunk of results.body) {
    res.write(chunk.toString());
  }
  res.end();
};

const routes = Router().use('/', sparql).post('/', sparql);

export default routes;
