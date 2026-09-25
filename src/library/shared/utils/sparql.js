import jsonld from 'jsonld';
import { Parser as N3Parser } from 'n3';
import Papa from 'papaparse';

// Use a fetch-based document loader
jsonld.documentLoader = async (documentUrl) => {
  const document = await fetch(documentUrl).then((r) => r.json());
  return {
    contextUrl: null,
    document,
    documentUrl,
  };
};

const env = typeof process !== 'undefined' && process.env ? process.env : {};

const config = {
  // The type of triple store behind the SPARQL endpoint: 'blazegraph' or 'qlever'
  backend: env.SPARQL_BACKEND ?? 'blazegraph',
  // Access token sent with SPARQL updates (required by QLever)
  updateToken: env.SPARQL_UPDATE_TOKEN,
};

/**
 * Configures the SPARQL client (for environments where process.env is not available)
 * @param {{ backend?: 'blazegraph' | 'qlever', updateToken?: string }} options
 */
export function configureSparql(options) {
  Object.assign(config, options);
}

export function sparqlBackend() {
  return config.backend;
}

export function updateHeaders(headers = {}) {
  return config.updateToken ? { ...headers, Authorization: `Bearer ${config.updateToken}` } : headers;
}

export function fetchSparql(query, endpoint, mimetype) {
  const body = new URLSearchParams({ query });
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: mimetype,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': body.toString().length.toString(),
    },
    body,
  });
}

async function checkResponse(resp) {
  if (!resp.ok) {
    const message = await resp.text();
    throw new Error(`SPARQL endpoint returned ${resp.status} ${resp.statusText}: ${message.slice(0, 2000)}`);
  }
  return resp;
}

export async function select(query, endpoint) {
  const resp = await checkResponse(await fetchSparql(query, endpoint, 'text/csv'));
  const text = await resp.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return data || [];
}

export async function ask(query, endpoint) {
  const resp = await checkResponse(await fetchSparql(query, endpoint, 'application/sparql-results+json'));
  const json = await resp.json();
  return !!json.boolean;
}

const XSD_INT = 'http://www.w3.org/2001/XMLSchema#int';
const XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';

// QLever stores all integer literals (xsd:integer, xsd:nonNegativeInteger, ...) natively and returns them as xsd:int.
// The HRA KG uses xsd:integer, which the JSON-LD contexts/frames expect, so map them back.
function literalDatatype(datatype) {
  return config.backend === 'qlever' && datatype === XSD_INT ? XSD_INTEGER : datatype;
}

// Converts an RDF/JS term to the term format used internally by jsonld.fromRDF
function toJsonLdTerm(term) {
  switch (term.termType) {
    case 'BlankNode':
      return { termType: 'BlankNode', value: `_:${term.value}` };
    case 'Literal':
      return {
        termType: 'Literal',
        value: term.value,
        datatype: { termType: 'NamedNode', value: literalDatatype(term.datatype.value) },
        ...(term.language ? { language: term.language } : {}),
      };
    case 'DefaultGraph':
      return { termType: 'DefaultGraph', value: '' };
    default:
      return { termType: term.termType, value: term.value };
  }
}

function parseNTriples(ntriples) {
  return new N3Parser({ format: 'application/n-triples' }).parse(ntriples).map((quad) => ({
    subject: toJsonLdTerm(quad.subject),
    predicate: toJsonLdTerm(quad.predicate),
    object: toJsonLdTerm(quad.object),
    graph: toJsonLdTerm(quad.graph),
  }));
}

export async function construct(query, endpoint, frame = undefined) {
  // Not all triple stores (e.g., QLever) can return JSON-LD, so fetch N-Triples and convert locally.
  // Blazegraph only knows N-Triples as text/plain.
  const resp = await checkResponse(await fetchSparql(query, endpoint, 'application/n-triples, text/plain;q=0.9'));
  const quads = parseNTriples(await resp.text());
  const json = await jsonld.fromRDF(quads);
  if (frame) {
    return await jsonld.frame(json, frame);
  } else {
    return json;
  }
}

export async function update(updateQuery, endpoint) {
  return fetch(endpoint, {
    method: 'POST',
    headers: updateHeaders({
      'Content-Type': 'application/sparql-update',
    }),
    body: updateQuery,
  });
}

export async function deleteGraph(graph, endpoint) {
  return update(`CLEAR GRAPH <${graph}>;`, endpoint);
}

export async function deleteGraphs(graphs, endpoint) {
  const updateQuery = graphs.map((graph) => `CLEAR GRAPH <${graph}>;`).join('\n');
  return update(updateQuery, endpoint);
}
