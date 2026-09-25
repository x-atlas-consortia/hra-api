import { select } from './sparql.js';

const QUERY = 'SELECT DISTINCT ?g WHERE {  GRAPH ?g { ?s ?p ?o . } }';

// Checks for the existence of specific graphs only. This avoids scanning all quads, which is
// slow on triple stores without a dedicated graph index (e.g., QLever)
function candidatesQuery(candidates) {
  const unions = candidates
    .map((graph) => `{ SELECT (<${graph}> AS ?g) WHERE { GRAPH <${graph}> { ?s ?p ?o . } } LIMIT 1 }`)
    .join('\n  UNION\n  ');
  return `SELECT ?g WHERE {\n  ${unions}\n}`;
}

/**
 * Lists the named graphs in the endpoint
 * @param {string} endpoint - The SPARQL endpoint
 * @param {string[]} [candidates] - If given, only check which of these graphs exist
 * @returns {Promise<Set<string>>} the named graphs
 */
export async function namedGraphs(endpoint, candidates = undefined) {
  if (candidates?.length === 0) {
    return new Set();
  }
  const graphs = await select(candidates ? candidatesQuery(candidates) : QUERY, endpoint);
  return new Set(graphs.map((graph) => graph.g));
}
