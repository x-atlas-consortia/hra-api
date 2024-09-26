import jsonld from 'jsonld';
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

export async function select(query, endpoint) {
  const resp = await fetchSparql(query, endpoint, 'text/csv');
  const text = await resp.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return data || [];
}

export async function ask(query, endpoint) {
  const resp = await fetchSparql(query, endpoint, 'application/sparql-results+json');
  const json = await resp.json();
  return !!json.boolean;
}

export async function construct(query, endpoint, frame = undefined) {
  const resp = await fetchSparql(query, endpoint, 'application/ld+json');
  const json = await resp.json();
  if (frame) {
    return await jsonld.frame(json, frame);
  } else {
    return json;
  }
}

export async function update(updateQuery, endpoint) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update',
    },
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
