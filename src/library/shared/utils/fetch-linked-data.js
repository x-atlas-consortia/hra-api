import formats from '@rdfjs/formats-common';
import { isReadableStream } from 'is-stream';
import jsonld from 'jsonld';
import patchResponse from 'nodeify-fetch/lib/patchResponse.browser.js';

export const EXTENSION_MAPPING = {
  'json-ld': 'application/ld+json',
  jsonld: 'application/ld+json',
  json: 'application/ld+json',
  nt: 'application/n-triples',
  nq: 'application/n-quads',
  n3: 'text/n3',
  owl: 'application/rdf+xml',
  rdf: 'application/rdf+xml',
  xml: 'application/rdf+xml',
  trig: 'application/trig',
  turtle: 'text/turtle',
  ttl: 'text/turtle',
  html: 'text/html',
  htm: 'text/html'
};

export async function getQuads(url) {
  const parsers = formats.parsers;
  const res = await fetch(url, {
    headers: new Headers({
      accept: [...parsers.keys()].sort().reverse().join(', '),
    }),
  });

  const type = res.headers.get('content-type').split(';')[0];
  const extension = EXTENSION_MAPPING[url.split('.').slice(-1)[0]];
  const guessedType = parsers.has(type) ? type : parsers.has(extension) ? extension : undefined;
  if (type === 'application/json' || guessedType === 'application/ld+json') {
    const json = await res.json();
    const quads = await jsonld.toRDF(json);
    return quads;
  } else if (guessedType) {
    let body = res.body;
    if (!isReadableStream(body)) {
      body = patchResponse(res).body;
    }
    const stream = parsers.import(guessedType, body, { baseIRI: url });
    const quads = [];
    for await (const quad of stream) {
      quads.push(quad);
    }
    return quads;
  } else {
    // Try to parse the response as a JSON-LD string
    try {
      const json = JSON.parse(await res.text());
      const quads = await jsonld.toRDF(json);
      return quads;
    } catch (err) {
      return Promise.reject(new Error(`unknown content type: ${type}`));
    }
  }
}
