import { addToEndpoint } from './add-to-endpoint.js';
import { getQuads } from './fetch-linked-data.js';
import { namedGraphs } from './named-graphs.js';
import { update } from './sparql.js';

/**
 * Ensures the given named graphs exist in the endpoint, loading any missing ones
 * @param {string[]} graphsToCheck - graphs to check, as 'graph@@url' strings
 * @param {string} endpoint - the SPARQL endpoint
 * @param {string[]} [otherGraphs] - additional graphs to report the existence of (not loaded if missing)
 * @returns {Promise<Set<string>>} the graphs that exist in the endpoint (from graphsToCheck and otherGraphs)
 */
export async function ensureNamedGraphs(graphsToCheck, endpoint, otherGraphs = []) {
  const candidates = graphsToCheck.map((graphAndUrl) => graphAndUrl.split('@@')[0]).concat(otherGraphs);
  const graphs = new Set(await namedGraphs(endpoint, candidates));
  let updateQuery = '';
  for (const graphAndUrl of graphsToCheck) {
    const graph = graphAndUrl.split('@@')[0];
    const url = graphAndUrl.split('@@').slice(-1)[0];
    if (!graphs.has(graph)) {
      console.log(new Date().toISOString(), 'Adding named graph:', graph);
      updateQuery += `
CLEAR GRAPH <${graph}>;
LOAD <${url}> INTO GRAPH <${graph}>;
`;
      graphs.add(graph);
    }
  }
  if (updateQuery) {
    await update(updateQuery, endpoint);
  }
  return graphs;
}

export async function ensureNamedGraphsInMemory(graphsToCheck, endpoint) {
  const graphs = new Set(await namedGraphs(endpoint, graphsToCheck));
  for (const graph of graphsToCheck) {
    if (!graphs.has(graph)) {
      console.log(new Date().toISOString(), 'Adding named graph:', graph);
      const quads = await getQuads(graph);
      await addToEndpoint(graph, quads, endpoint);
      graphs.add(graph);
    }
  }
  return graphs;
}
