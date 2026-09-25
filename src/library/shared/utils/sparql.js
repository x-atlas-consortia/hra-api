import jsonld from 'jsonld';
import { StreamParser as N3StreamParser } from 'n3';
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

const XSD = 'http://www.w3.org/2001/XMLSchema#';

// QLever stores numbers natively and returns all integers (xsd:integer, xsd:nonNegativeInteger, ...) as xsd:int
// and all doubles as xsd:decimal. The HRA KG only uses xsd:integer and xsd:double, which the JSON-LD
// contexts/frames expect, so map them back.
const QLEVER_DATATYPES = {
  [`${XSD}int`]: `${XSD}integer`,
  [`${XSD}decimal`]: `${XSD}double`,
};

function literalDatatype(datatype) {
  return (config.backend === 'qlever' && QLEVER_DATATYPES[datatype]) || datatype;
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

function toJsonLdQuad(quad) {
  return {
    subject: toJsonLdTerm(quad.subject),
    predicate: toJsonLdTerm(quad.predicate),
    object: toJsonLdTerm(quad.object),
    graph: toJsonLdTerm(quad.graph),
  };
}

// Iterates over the chunks of a response body (node streams or web streams without async iteration support)
async function* bodyChunks(body) {
  if (body[Symbol.asyncIterator]) {
    yield* body;
  } else {
    const reader = body.getReader();
    for (let result = await reader.read(); !result.done; result = await reader.read()) {
      yield result.value;
    }
  }
}

// Parses an N-Triples response incrementally (large results may exceed the maximum string length)
async function parseNTriplesResponse(resp) {
  const parser = new N3StreamParser({ format: 'application/n-triples' });
  const quads = [];
  let error;
  const done = new Promise((resolve) => {
    parser.on('data', (quad) => quads.push(toJsonLdQuad(quad)));
    parser.on('end', resolve);
    parser.on('error', (err) => {
      error = error ?? err;
      resolve();
    });
  });
  const decoder = new TextDecoder();
  for await (const chunk of bodyChunks(resp.body)) {
    parser.write(typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true }));
    if (error) {
      // E.g., the triple store reported an error (like a timeout) in the middle of the response
      throw error;
    }
  }
  parser.end(decoder.decode());
  await done;
  if (error) {
    throw error;
  }
  return quads;
}

export async function construct(query, endpoint, frame = undefined) {
  // Not all triple stores (e.g., QLever) can return JSON-LD, so fetch N-Triples and convert locally.
  // Blazegraph only knows N-Triples as text/plain.
  const resp = await checkResponse(await fetchSparql(query, endpoint, 'application/n-triples, text/plain;q=0.9'));
  const quads = await parseNTriplesResponse(resp);
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
