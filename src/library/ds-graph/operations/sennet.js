import { getDatasetGraph } from '../utils/xconsortia/graph.js';

const SENNET_SEARCH_API_ENDPOINT = 'https://search.api.sennetconsortium.org/entities/search';

export async function sennetRegistrations(token = undefined) {
  return await getDatasetGraph(SENNET_SEARCH_API_ENDPOINT, token);
}
