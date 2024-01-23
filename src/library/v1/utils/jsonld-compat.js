export function expandIri(iri) {
  return iri && typeof iri === 'string'
    ? iri
        .replace('ccf:', 'http://purl.org/ccf/')
        .replace('ccf1:', 'http://purl.org/ccf/latest/ccf.owl#')
        .replace('../sig/ont/fma/fma', 'http://purl.org/sig/ont/fma/fma')
        .replace('fma:', 'http://purl.org/sig/ont/fma/fma')
        .replace('http://purl.obolibrary.org/obo/FMA_', 'http://purl.org/sig/ont/fma/fma')
    : iri;
}

export function normalizeJsonLd(jsonld, arrayFields = new Set()) {
  return JSON.parse(JSON.stringify(jsonld), (key, value) => {
    if (arrayFields.has(key)) {
      value = ensureArray(value);
    }
    if (typeof value === 'object' && value?.['@type'] && value['@value'] && (
        value['@type'].startsWith('xsd:') || 
        value['@type'].startsWith('http://www.w3.org/2001/XMLSchema#')
      )) {
      switch (value['@type']) {
        case 'http://www.w3.org/2001/XMLSchema#integer':
        case 'http://www.w3.org/2001/XMLSchema#double':
        case 'http://www.w3.org/2001/XMLSchema#decimal':
        case 'xsd:integer':
        case 'xsd:double':
        case 'xsd:decimal':
          return Number(value['@value']);
        case 'http://www.w3.org/2001/XMLSchema#date':
        case 'xsd:date':
          return value['@value'];
        default:
          return value;
      }
    } else if (Array.isArray(value)) {
      return value.map(expandIri);
    } else {
      return expandIri(value);
    }
  });
}

export function ensureString(value) {
  if (value?.['@value']) {
    return value['@value'];
  } else {
    return value;
  }
}

export function ensureArray(thing) {
  if (Array.isArray(thing)) {
    return thing;
  } else if (thing) {
    return [thing];
  } else {
    return [];
  }
}

export function ensureNumber(value) {
  if (value?.['@type']) {
    return Number(value['@value']);
  } else if (typeof value === 'string') {
    return Number(value);
  } else {
    return value;
  }
}

export function ensureGraphArray(results) {
  if (results?.['@graph']) {
    return results['@graph'];
  } else if (results?.['@id']) {
    delete results['@context'];
    return [results];
  } else {
    return [];
  }
}
