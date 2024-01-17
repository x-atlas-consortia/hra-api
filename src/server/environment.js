
export function sparqlEndpoint() {
  return process.env.SPARQL_ENDPOINT ?? 'https://lod.humanatlas.io/sparql';
}

export function port() {
  return process.env.PORT || 3000;
}
