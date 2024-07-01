import { searchXConsortia } from '../utils/xconsortia-fetch.js';

const SENNET_SEARCH_API_ENDPOINT = 'https://search.api.sennetconsortium.org/entities/search';

export async function sennetRegistrations(filter) {
  const token = filter.sessionToken ?? undefined;
  return await searchXConsortia(SENNET_SEARCH_API_ENDPOINT, 'search-api', undefined, token);
}
