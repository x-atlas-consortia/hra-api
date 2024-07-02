import { searchXConsortia } from '../utils/xconsortia-fetch.js';

const HUBMAP_SEARCH_API_ENDPOINT = 'https://search.api.hubmapconsortium.org/v3/entities/search';

export async function hubmapRegistrations(token = undefined) {
  return await searchXConsortia(HUBMAP_SEARCH_API_ENDPOINT, 'search-api', undefined, token);
}
