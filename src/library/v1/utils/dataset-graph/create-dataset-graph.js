import { addToEndpoint } from '../../../shared/utils/add-to-endpoint.js';
import { ensureNamedGraphs } from '../../../shared/utils/ensure-named-graphs.js';
import { getQuads } from '../../../shared/utils/fetch-linked-data.js';
import { enrichDatasetGraph } from './enrich-ds-graph.js';

export const DEFAULT_GRAPHS = [
  'https://purl.humanatlas.io/collection/hra-api@@https://cdn.humanatlas.io/digital-objects/collection/hra-api/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/hra-ccf-patches@@https://cdn.humanatlas.io/digital-objects/graph/hra-ccf-patches/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/hra-pop@@https://cdn.humanatlas.io/digital-objects/graph/hra-pop/latest/graph.ttl',
  'https://purl.humanatlas.io/collection/ds-graphs@@https://cdn.humanatlas.io/digital-objects/collection/ds-graphs/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/ds-graphs-enrichments@@https://cdn.humanatlas.io/digital-objects/graph/ds-graphs-enrichments/latest/graph.ttl',
];

export async function createDatasetGraph(token, request, endpoint) {
  // Ensure default graphs exist in the db
  const graphs = await ensureNamedGraphs(DEFAULT_GRAPHS, endpoint);

  // Add data sources to the new dataset graph
  const dsGraph = `urn:hra-api:${token}:ds-graph`;
  const dsGraphEnrichments = 'https://purl.humanatlas.io/graph/ds-graphs-enrichments';
  if (!graphs.has(dsGraph)) {
    for (const source of request.dataSources) {
      console.log(new Date().toISOString(), 'Adding', source, 'to', dsGraph);
      const quads = await getQuads(source);
      await addToEndpoint(dsGraph, quads, endpoint);
    }

    // Update the dataset graph enrichments
    console.log(new Date().toISOString(), 'Enriching', dsGraph);
    await enrichDatasetGraph(dsGraph, dsGraphEnrichments, endpoint);
    console.log(new Date().toISOString(), 'Enriched to', dsGraphEnrichments);
  }
}
