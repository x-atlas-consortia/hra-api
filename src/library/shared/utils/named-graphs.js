import { select } from './sparql.js';

const QUERY = 'SELECT DISTINCT ?g WHERE {  GRAPH ?g { ?s ?p ?o . } }';

export async function namedGraphs(endpoint) {
  const graphs = await select(QUERY, endpoint);
  return new Set(graphs.map((graph) => graph.g));
}
