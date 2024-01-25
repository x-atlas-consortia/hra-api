export function sparqlEndpoint() {
  return process.env.SPARQL_ENDPOINT ?? 'https://lod.humanatlas.io/sparql';
}

export function port() {
  return process.env.PORT || 3000;
}

export function shortCacheTimeout() {
  return process.env.CACHE_TIMEOUT || 3600;
}

export function longCacheTimeout() {
  return process.env.LONG_CACHE_TIMEOUT || shortCacheTimeout() * 24;
}

export function activeQueryLimit() {
  return process.env.ACTIVE_QUERIES || 4;
}
