import { update } from '../../../shared/utils/sparql.js';
import query from '../../queries/ds-graph-enrichment.rq';

export async function enrichDatasetGraph(dsGraph, dsGraphEnrichments, endpoint) {
  const updateQuery = query
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
