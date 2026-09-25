import toNT from '@rdfjs/to-ntriples';
import stream from 'stream-browserify';
import { sparqlBackend, updateHeaders } from './sparql.js';

function toTripleString(quad) {
  const subject = toNT(quad.subject).replace('_:_:', '_:');
  const predicate = toNT(quad.predicate).replace('_:_:', '_:');
  const object = toNT(quad.object).replace('_:_:', '_:');
  return `${subject} ${predicate} ${object} .\n`;
}

function* sparqlUpdateIterator(graph, quads) {
  yield `
INSERT DATA {
GRAPH <${graph}> {
`;
  for (const quad of quads) {
    yield toTripleString(quad);
  }
  yield '}}\n';
}

function* nTriplesIterator(quads) {
  for (const quad of quads) {
    yield toTripleString(quad);
  }
}

export async function addToEndpoint(graph, quads, endpoint) {
  if (sparqlBackend() === 'qlever') {
    // Use the SPARQL 1.1 Graph Store HTTP Protocol, which is parsed much faster than a large INSERT DATA
    const url = new URL(endpoint);
    url.searchParams.set('graph', graph);
    return fetch(url.toString(), {
      method: 'POST',
      headers: updateHeaders({
        'Content-Type': 'application/n-triples',
      }),
      body: stream.Readable.from(nTriplesIterator(quads)),
    });
  }

  return fetch(endpoint, {
    method: 'POST',
    headers: updateHeaders({
      'Content-Type': 'application/sparql-update',
    }),
    body: stream.Readable.from(sparqlUpdateIterator(graph, quads)),
  });
}
