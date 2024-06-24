import { addToEndpoint } from '../../../shared/utils/add-to-endpoint.js';
import { ensureNamedGraphs } from '../../../shared/utils/ensure-named-graphs.js';
import { getQuads } from '../../../shared/utils/fetch-linked-data.js';
import { update } from '../../../shared/utils/sparql.js';
import query from '../../queries/update-dataset-info.rq';
import { enrichDatasetGraph } from './enrich-ds-graph.js';

export const DEFAULT_GRAPHS = [
  'https://purl.humanatlas.io/collection/hra-api@@https://cdn.humanatlas.io/digital-objects/collection/hra-api/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/hra-ccf-patches@@https://cdn.humanatlas.io/digital-objects/graph/hra-ccf-patches/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/hra-pop@@https://cdn.humanatlas.io/digital-objects/graph/hra-pop/latest/graph.ttl',
  'https://purl.humanatlas.io/collection/ds-graphs@@https://cdn.humanatlas.io/digital-objects/collection/ds-graphs/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/ds-graphs-enrichments@@https://cdn.humanatlas.io/digital-objects/graph/ds-graphs-enrichments/latest/graph.ttl',
];

async function  updateDatasetInfo(status, message, token, endpoint) {
  console.log(new Date().toISOString(), token, status, message);
  const updateQuery = query
    .replace('urn:hra-api:TOKEN:ds-graph', `urn:hra-api:${token}:ds-graph`)
    .replace('{{STATUS}}', status)
    .replace('{{MESSAGE}}', message);
  return update(updateQuery, endpoint);
}

export async function createDatasetGraph(token, request, endpoint) {
  try {
    // Ensure default graphs exist in the db
    const graphs = await ensureNamedGraphs(DEFAULT_GRAPHS, endpoint);

    // Add data sources to the new dataset graph
    const dsGraph = `urn:hra-api:${token}:ds-graph`;
    const dsGraphEnrichments = 'https://purl.humanatlas.io/graph/ds-graphs-enrichments';
    if (!graphs.has(dsGraph)) {
      for (const source of request.dataSources) {
        await updateDatasetInfo('Loading', `Adding ${source} to dataset`, token, endpoint);
        const quads = await getQuads(source);
        await addToEndpoint(dsGraph, quads, endpoint);
      }

      // Update the dataset graph enrichments
      await updateDatasetInfo('Loading', `Enriching dataset`, token, endpoint);
      await enrichDatasetGraph(dsGraph, dsGraphEnrichments, endpoint);
      await updateDatasetInfo('Ready', `Dataset ready`, token, endpoint);
    }
  } catch (err) {
    await updateDatasetInfo('Error', `Error processing dataset`, token, endpoint)
    console.error('ERROR', token, request, endpoint, err);
  }
}
