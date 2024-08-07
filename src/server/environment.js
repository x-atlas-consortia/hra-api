const DEFAULT_SPARQL_ENDPOINT = 'https://lod.humanatlas.io/sparql';

export function sparqlEndpoint() {
  return process.env.SPARQL_ENDPOINT ?? DEFAULT_SPARQL_ENDPOINT;
}

export function isWritable() {
  return process.env.SPARQL_WRITABLE === 'true';
}

export function exposedSparqlEndpoint() {
  return process.env.EXPOSED_SPARQL_ENDPOINT ?? (isWritable() ? DEFAULT_SPARQL_ENDPOINT : sparqlEndpoint());
}

export function port() {
  return process.env.PORT || 3000;
}

export function shortCacheTimeout() {
  return process.env.CACHE_TIMEOUT || 3600;
}

export function pruningSchedule() {
  return process.env.PRUNING_SCHEDULE || '*/1 * * * *'; // '0 1 * * *';
}

export function longCacheTimeout() {
  return process.env.LONG_CACHE_TIMEOUT || shortCacheTimeout() * 24;
}

export function activeQueryLimit() {
  return process.env.ACTIVE_QUERIES || 4;
}

export function cacheDir() {
  return process.env.FILE_CACHE_DIR || './file-cache';
}
