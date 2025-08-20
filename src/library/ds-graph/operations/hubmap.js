import { getDatasetGraph } from '../utils/xconsortia/graph.js';

const HUBMAP_SEARCH_API_ENDPOINT = 'https://search.api.hubmapconsortium.org/v3/entities/search';

export async function hubmapRegistrations(token = undefined, primaryOnly = false) {
  return await getDatasetGraph(HUBMAP_SEARCH_API_ENDPOINT, token, primaryOnly);
}
