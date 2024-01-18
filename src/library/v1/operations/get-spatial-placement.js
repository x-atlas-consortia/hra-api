import { getSpatialGraph } from '../../shared/spatial/spatial-graph.js';

export async function getSpatialPlacement(extractionSite, targetIri, endpoint = 'https://lod.humanatlas.io/sparql') {
  const graph = await getSpatialGraph(endpoint);
  return graph.getSpatialPlacement(extractionSite, targetIri);
}
