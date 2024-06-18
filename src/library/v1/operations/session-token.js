import md5 from 'md5';
import { clearSpatialGraph } from '../../shared/spatial/spatial-graph.js';
import { addToEndpoint } from '../../shared/utils/add-to-endpoint.js';
import { getQuads } from '../../shared/utils/fetch-linked-data.js';
import { namedGraphs } from '../../shared/utils/named-graphs.js';
import { enrichDatasetGraph } from './enrich-ds-graph.js';

function isValidUrl(url) {
  try {
    const resource = new URL(url);
    if (!(resource.protocol === 'http:' || resource.protocol === 'https:')) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

const DEFAULT_GRAPHS = [
  'https://purl.humanatlas.io/collection/hra-api',
  'https://purl.humanatlas.io/graph/hra-ccf-patches',
  'https://purl.humanatlas.io/graph/hra-pop',
  'https://purl.humanatlas.io/collection/ds-graphs',
  'https://purl.humanatlas.io/graph/ds-graphs-enrichments'
];

export async function createSessionToken(request, endpoint) {
  const token = md5(JSON.stringify(request));

  if (request?.dataSources?.length > 0) {
    if (!request.dataSources.every(isValidUrl)) {
      return { error: 'One or more data sources had an invalid URL.' };
    }
    
    // Ensure default graphs exist in the db
    const graphs = new Set(await namedGraphs(endpoint));
    for (const graph of DEFAULT_GRAPHS) {
      if (!graphs.has(graph)) {
        console.log(new Date().toISOString(), 'Adding default graph:', graph);
        const quads = await getQuads(graph);
        await addToEndpoint(graph, quads, endpoint);
      }
    }

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

    // Reset the spatial graph after loading a new dataset
    clearSpatialGraph();
  }

  return { token };
}
