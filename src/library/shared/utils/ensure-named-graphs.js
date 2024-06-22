import { addToEndpoint } from './add-to-endpoint.js';
import { getQuads } from './fetch-linked-data.js';
import { namedGraphs } from './named-graphs.js';
import { update } from './sparql.js';

export async function ensureNamedGraphs(graphsToCheck, endpoint) {
  const graphs = new Set(await namedGraphs(endpoint));
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
  update(updateQuery, endpoint);
  return graphs;
}

export async function ensureNamedGraphsInMemory(graphsToCheck, endpoint) {
  const graphs = new Set(await namedGraphs(endpoint));
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
