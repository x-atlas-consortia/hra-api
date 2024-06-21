import { addToEndpoint } from './add-to-endpoint.js';
import { getQuads } from './fetch-linked-data.js';
import { namedGraphs } from './named-graphs.js';

export async function ensureNamedGraphs(graphsToCheck, endpoint) {
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
