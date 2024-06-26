import toNT from '@rdfjs/to-ntriples';
import stream from 'stream-browserify';

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

export async function addToEndpoint(graph, quads, endpoint) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update',
    },
    body: stream.Readable.from(sparqlUpdateIterator(graph, quads)),
  });
}
