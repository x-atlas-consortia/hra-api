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

export function expandIris(obj) {
  return JSON.parse(JSON.stringify(obj), (_key, value) => {
    if (Array.isArray(value)) {
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
  if (results['@graph']) {
    return results['@graph'];
  } else if (results['@id']) {
    delete results['@context'];
    return [results];
  } else {
    return [];
  }
}
