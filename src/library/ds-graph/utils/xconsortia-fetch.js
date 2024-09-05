// Converted from transpiled ccf-ui code:
// https://github.com/hubmapconsortium/ccf-ui/blob/main/projects/ccf-database/src/lib/xconsortia/xconsortia-data-import.ts

import { xConsortiaResponseAsJsonLd } from './xconsortia-data.js';

// Reduce this value if including more data fields
const PER_API_SEARCH_REQUEST_COUNT = 10000;

const INCLUDED_DATA_FIELDS = [
  'uuid',
  'entity_type',
  'hubmap_id',
  'sennet_id',
  'group_uuid',
  'group_name',
  'last_modified_timestamp',
  'created_by_user_displayname',
  'donor',
  'source',
  'descendants.entity_type',
  'descendants.ingest_metadata.metadata.tissue_id',
  'descendants.last_modified_timestamp',
  'descendants.group_uuid',
  'descendants.group_name',
  'descendants.created_by_user_displayname',
  'descendants.uuid',
  'descendants.hubmap_id',
  'descendants.sennet_id',
  'descendants.submission_id',
  'descendants.dataset_type',
  'descendants.thumbnail_file',
  'rui_location',
  'sample_category',
];

const DEFAULT_API_SEARCH_QUERY = {
  exists: {
    field: 'rui_location',
  },
};

function getApiSearchHeaders(token) {
  const headers = new Headers();
  headers.append('Content-type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function getApiSearchBody(from, size, query) {
  const bodyObj = {
    version: true,
    from,
    size,
    stored_fields: ['*'],
    script_fields: {},
    docvalue_fields: [],
    query: query ?? DEFAULT_API_SEARCH_QUERY,
    _source: {
      includes: INCLUDED_DATA_FIELDS,
    },
  };
  return JSON.stringify(bodyObj);
}

async function doSearchRequest(url, init) {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    const validResponse = res.ok || text.startsWith('https');
    if (validResponse) {
      if (text.startsWith('https')) {
        return await fetch(text).then((r) => r.json());
      } else {
        return JSON.parse(text);
      }
    }
    return undefined;
  } catch (_error) {
    return undefined;
  }
}

async function doApiSearch(url, token, query) {
  const perReqCount = PER_API_SEARCH_REQUEST_COUNT;
  const headers = getApiSearchHeaders(token);
  const body = getApiSearchBody(0, perReqCount, query);
  const firstResult = await doSearchRequest(url, { method: 'POST', headers, body });
  if (!firstResult) {
    return undefined;
  }
  const totalCount = firstResult.hits.total.value;
  if (totalCount <= perReqCount) {
    return firstResult;
  }
  const requests = [];
  for (let from = perReqCount; from < totalCount; from += perReqCount) {
    requests.push(
      doSearchRequest(url, {
        method: 'POST',
        headers,
        body: getApiSearchBody(from, perReqCount, query),
      })
    );
  }
  const results = await Promise.all(requests);
  if (results.some((res) => !res)) {
    return undefined;
  }
  const items = results.map((res) => res.hits.hits);
  return {
    ...firstResult,
    hits: {
      ...firstResult.hits,
      hits: firstResult.hits.hits.concat(...items),
    },
  };
}

/**
 * Search the X Atlas Consortium Search API and return HRA-compatible JSON-LD data
 *
 * @param dataUrl the search API url
 * @param serviceType 'static' if a statically saved response or 'search-api' if querying the search-api live
 * @param query the elastic search query to use
 * @param serviceToken the api key to the search-api
 * @param assetsApi the assets api endpoint (deprecated)
 * @param portalUrl the portal url to point to (deprecated)
 * @returns CCF-compatible JSON-LD data or undefined on error
 */
export async function searchXConsortia(dataUrl, serviceType, query, serviceToken, _assetsApi = '', _portalUrl = '') {
  let hubmapData;
  if (serviceType === 'static') {
    hubmapData = await doSearchRequest(dataUrl);
  } else if (serviceType === 'search-api') {
    hubmapData = await doApiSearch(dataUrl, serviceToken, query);
  }
  if (hubmapData) {
    return xConsortiaResponseAsJsonLd(hubmapData, serviceToken);
  } else {
    console.warn(`Unable to load ${dataUrl}`);
    return undefined;
  }
}
