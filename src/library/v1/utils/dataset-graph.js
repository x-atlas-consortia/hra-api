import { addToEndpoint } from '../../shared/utils/add-to-endpoint.js';
import { ensureNamedGraphs } from '../../shared/utils/ensure-named-graphs.js';
import { getQuads } from '../../shared/utils/fetch-linked-data.js';
import { deleteGraphs, select, update } from '../../shared/utils/sparql.js';
import enrichQuery from '../queries/ds-graph-enrichment.rq';
import getInfoQuery from '../queries/get-dataset-info.rq';
import prunableDatasetsQuery from '../queries/prunable-datasets.rq';
import initializeQuery from '../queries/start-dataset-info.rq';
import updateInfoQuery from '../queries/update-dataset-info.rq';

export const DEFAULT_GRAPHS = [
  'https://purl.humanatlas.io/collection/hra-api@@https://cdn.humanatlas.io/digital-objects/collection/hra-api/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/hra-ccf-patches@@https://cdn.humanatlas.io/digital-objects/graph/hra-ccf-patches/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/hra-pop@@https://cdn.humanatlas.io/digital-objects/graph/hra-pop/latest/graph.ttl',
  'https://purl.humanatlas.io/collection/ds-graphs@@https://cdn.humanatlas.io/digital-objects/collection/ds-graphs/latest/graph.ttl',
  'https://purl.humanatlas.io/graph/ds-graphs-enrichments@@https://cdn.humanatlas.io/digital-objects/graph/ds-graphs-enrichments/latest/graph.ttl',
];

export async function initializeDatasetGraph(token, _request, endpoint) {
  const updateQuery = initializeQuery
    .replace('urn:hra-api:TOKEN:ds-info', `urn:hra-api:${token}:ds-info`)
    .replace('urn:hra-api:TOKEN:ds-graph', `urn:hra-api:${token}:ds-graph`);
  await update(updateQuery, endpoint);
}

export async function updateDatasetInfo(status, message, token, endpoint) {
  console.log(new Date().toISOString(), token, status, message);
  const updateQuery = updateInfoQuery
    .replace('urn:hra-api:TOKEN:ds-info', `urn:hra-api:${token}:ds-info`)
    .replace('{{STATUS}}', status)
    .replace('{{MESSAGE}}', message);
  return update(updateQuery, endpoint);
}

export async function getDatasetInfo(token, endpoint) {
  const infoQuery = getInfoQuery.replace('urn:hra-api:TOKEN:ds-info', `urn:hra-api:${token}:ds-info`);
  const status = await select(infoQuery, endpoint);
  const results =
    status.length > 0
      ? status[0]
      : {
          status: 'Error',
          message: 'Unknown error while loading database',
          checkback: 3600000,
          loadTime: 22594,
          timestamp: new Date().toISOString(),
        };

  results.loadTime =
    results.loadTime ||
    (results.status === 'Loading' ? new Date() : new Date(results.timestamp)) - new Date(results.startTime);

  return results;
}

export async function createDatasetGraph(token, request, endpoint) {
  try {
    // Ensure default graphs exist in the db
    const graphs = await ensureNamedGraphs(DEFAULT_GRAPHS, endpoint);

    // Add data sources to the new dataset graph
    const dsGraph = `urn:hra-api:${token}:ds-graph`;
    const dsGraphEnrichments = `urn:hra-api:${token}:ds-graph-enrichments`;
    if (!graphs.has(dsGraph)) {
      for (const source of request.dataSources) {
        await updateDatasetInfo('Loading', `Adding dataset`, token, endpoint);
        const quads = await getQuads(source);
        await addToEndpoint(dsGraph, quads, endpoint);
      }

      // Update the dataset graph enrichments
      await updateDatasetInfo('Loading', `Enriching dataset`, token, endpoint);
      await enrichDatasetGraph(dsGraph, dsGraphEnrichments, endpoint);
    }
    await updateDatasetInfo('Ready', `Dataset ready`, token, endpoint);
  } catch (err) {
    console.error('ERROR', token, request, endpoint, err);
    await updateDatasetInfo('Error', `Error processing dataset`, token, endpoint);
  }
}

export async function enrichDatasetGraph(dsGraph, dsGraphEnrichments, endpoint) {
  const updateQuery = enrichQuery
    .replace('PREFIX DSGraphs: <https://purl.humanatlas.io/collection/ds-graphs>', `PREFIX DSGraphs: <${dsGraph}>`)
    .replace(
      'PREFIX DSGraphsExtra: <https://purl.humanatlas.io/graph/ds-graphs-enrichments>',
      `PREFIX DSGraphsExtra: <${dsGraphEnrichments}>`
    );

  const result = await update(updateQuery, endpoint);
  if (!result.ok) {
    console.log('error enriching', dsGraph, 'code:', result.status);
    console.error(await result.text());
  }
  return result;
}

export async function pruneDatasetGraphs(endpoint) {
  const datasets = await select(prunableDatasetsQuery, endpoint);
  console.log(datasets.length, 'datasets to prune');
  if (datasets.length > 0) {
    const graphs = datasets.reduce((acc, row) => acc.concat([row.dsInfo, row.dsGraph]), []);
    console.log('deleting', graphs);
    for (const graph of graphs) {
      await deleteGraphs([graph], endpoint);
    }
  }
}
