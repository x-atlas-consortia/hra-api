import md5 from 'md5';
import { createDatasetGraph, getDatasetInfo, initializeDatasetGraph } from '../utils/dataset-graph.js';

export async function createSessionToken(request, endpoint, startDatasetWork = createDatasetGraph) {
  const token = md5(JSON.stringify(request));

  if (request?.dataSources?.length > 0) {
    const dsInfo = await getDatasetInfo(token, endpoint);
    if (dsInfo.status !== 'Ready' && dsInfo.status !== 'Loading') {
      await initializeDatasetGraph(token, request, endpoint);
      await startDatasetWork(token, request, endpoint);
    }
  }

  return { token };
}
