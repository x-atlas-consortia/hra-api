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

/** Schedule for pruning expired session-token datasets (an empty string disables pruning) */
export function pruningSchedule() {
  return process.env.PRUNING_SCHEDULE ?? '0 6 * * *';
}

export function longCacheTimeout() {
  return process.env.LONG_CACHE_TIMEOUT || shortCacheTimeout() * 24;
}

/** Maximum number of requests processed at once, others are queued (0 = no limit, e.g., behind a load balancer) */
export function activeQueryLimit() {
  return Number(process.env.ACTIVE_QUERIES || 0);
}

/** Maximum number of session-token datasets built at once */
export function datasetBuildLimit() {
  return Number(process.env.DATASET_BUILDS || 2);
}

export function cacheDir() {
  return process.env.FILE_CACHE_DIR || './file-cache';
}
