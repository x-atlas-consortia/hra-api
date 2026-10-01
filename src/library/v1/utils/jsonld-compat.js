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

const DEFAULT_STRING_FIELDS = ['creator', 'creator_first_name', 'creator_last_name'];

// Spatial entity and placement fields that must be numbers (some source data has them as string literals)
const NUMERIC_FIELDS = new Set(
  ['dimension', 'translation', 'rotation', 'scaling']
    .flatMap((suffix) => ['x', 'y', 'z'].map((axis) => `${axis}_${suffix}`))
    .concat(['rui_rank', 'slice_count', 'slice_thickness'])
);
const NUMBER_PATTERN = /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/;

export function normalizeJsonLd(
  jsonld,
  arrayFields = new Set(),
  stringFields = new Set(DEFAULT_STRING_FIELDS),
  singleValueFields = new Set(),
) {
  return JSON.parse(JSON.stringify(jsonld), (key, value) => {
    if (singleValueFields.has(key)) {
      value = ensureSingleValue(value);
    }
    if (arrayFields.has(key)) {
      value = ensureArray(value);
    }
    if (stringFields.has(key)) {
      value = ensureString(value);
    }
    if (NUMERIC_FIELDS.has(key) && typeof value === 'string' && NUMBER_PATTERN.test(value)) {
      return Number(value);
    }
    if (
      typeof value === 'object' &&
      value?.['@type'] &&
      value['@value'] &&
      (value['@type'].startsWith('xsd:') || value['@type'].startsWith('http://www.w3.org/2001/XMLSchema#'))
    ) {
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

export function ensureSingleValue(value) {
  if (Array.isArray(value)) {
    // The order of multiple values depends on the triple store, so pick one deterministically
    return value.length > 1
      ? value.reduce((min, v) => (JSON.stringify(v) < JSON.stringify(min) ? v : min))
      : value[0];
  } else {
    return value;
  }
}

export function ensureString(value, arrayElementSeparator = '; ') {
  if (Array.isArray(value)) {
    return value.map(ensureString).join(arrayElementSeparator);
  } else if (value?.['@value']) {
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

export function renameField(obj, oldKey, newKey) {
  if (oldKey in obj) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
  }
}
