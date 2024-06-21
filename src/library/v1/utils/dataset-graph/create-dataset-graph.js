import { addToEndpoint } from '../../../shared/utils/add-to-endpoint.js';
import { ensureNamedGraphs } from '../../../shared/utils/ensure-named-graphs.js';
import { getQuads } from '../../../shared/utils/fetch-linked-data.js';
import { enrichDatasetGraph } from './enrich-ds-graph.js';

export const DEFAULT_GRAPHS = [
  'https://purl.humanatlas.io/collection/hra-api',
  'https://purl.humanatlas.io/graph/hra-ccf-patches',
  'https://purl.humanatlas.io/graph/hra-pop',
  'https://purl.humanatlas.io/collection/ds-graphs',
  'https://purl.humanatlas.io/graph/ds-graphs-enrichments',
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
