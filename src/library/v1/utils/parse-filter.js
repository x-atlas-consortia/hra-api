const FILTER_DEFAULTS = {
  sex: 'Both',
  ageRange: undefined,
  bmiRange: undefined,
  consortiums: [],
  tmc: [],
  technologies: [],
  ontologyTerms: [],
  cellTypeTerms: [],
  spatialSearches: [],
};

// Ignore terms which select everything
const SKIPPABLE_AS = new Set(['http://purl.obolibrary.org/obo/UBERON_0013702']);
const SKIPPABLE_CT = new Set(['http://purl.obolibrary.org/obo/CL_0000000']);
const SKIPPABLE_BM = new Set(['http://purl.org/ccf/biomarkers', 'http://purl.org/ccf/Biomarker']);

// ----------------------
// Utilities
// ----------------------

function equals(a, b) {
  return a === b;
}

function equalsIcase(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setIfDefined(obj, prop, value) {
  if (value !== undefined) {
    obj[prop] = value;
  }
}

function castArray(value) {
  return Array.isArray(value) ? value : [value];
}

function castNumericProps(obj, props) {
  const result = { ...obj };
  for (const prop of props) {
    if (prop in result) {
      result[prop] = +result[prop];
    }
  }

  return result;
}

// ----------------------
// Parsers
// ----------------------

function tryParseJson(value) {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
  } catch {
    /* Ignore */
  }

  return value;
}

function parseArray(value, separator) {
  const original = value;
  value = tryParseJson(value);
  switch (typeof value) {
    case 'string':
      if (separator && value === original) {
        return value.split(separator).filter((v) => !!v);
      }
      return [value];

    case 'boolean':
    case 'number':
      return [value];

    case 'object':
      return Array.isArray(value) ? value : undefined;

    default:
      return undefined;
  }
}

function parseArrayWithFilter(value, values, separator) {
  value = parseArray(value, separator);
  return value?.filter((v) => !values.has(v));
}

function parseStringEnum(value, values, icase = true) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const compare = icase ? equalsIcase : equals;
  return values.find((v) => compare(v, value));
}

function parseRange(value, min, max) {
  value = parseArray(value, ',');
  if (value === undefined || value.length === 0) {
    return undefined;
  } else if (value.length === 1) {
    value = value.concat(value)
  }

  value = value.slice(0, 2);
  value = value.map((v) => clamp(Number(v || 'NaN'), min, max));
  if (value.every(isNaN)) {
    return undefined;
  }

  const defaults = [min, max];
  value = value.map((v, i) => (isNaN(v) ? defaults[i] : v));
  if (value[0] > value[1]) {
    value.reverse();
  }

  return value;
}

function parseMinMax(value, min, max) {
  value = tryParseJson(value);
  if (typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return parseRange([value?.min, value?.max], min, max);
}

function parseSpatial(value) {
  value = tryParseJson(value);
  if (typeof value !== 'object') {
    return undefined;
  }

  let items = [];
  if (Array.isArray(value)) {
    items = value;
  } else {
    for (const key in value) {
      const values = castArray(value[key]);
      const diff = values.length - items.length;
      if (diff > 0) {
        items.push(...Array(diff).fill(0).map(() => ({})));
      }

      values.forEach((v, i) => (items[i][key] = v));
    }
  }

  if (items.length === 0) {
    return undefined;
  }

  const numericProps = ['x', 'y', 'z', 'radius'];
  return items.map((v) => castNumericProps(v, numericProps));
}

function parseSessionToken(value) {
  // Check if the token looks like an md5 hash
  if (typeof value === 'string' && /^[a-f0-9]{32}$/.test(value)) {
    return value;
  } else {
    return undefined;
  }
}

// ----------------------
// Implementation
// ----------------------

function processParameter(result, key, value) {
  switch (key.toLowerCase()) {
    case 'sex':
      setIfDefined(result, 'sex', parseStringEnum(value, ['Both', 'Female', 'Male']));
      break;

    case 'agerange':
    case 'age-range':
      setIfDefined(result, 'ageRange', parseRange(value, 1, 110));
      break;

    case 'age':
      setIfDefined(result, 'ageRange', parseMinMax(value, 1, 110));
      break;

    case 'bmirange':
    case 'bmi-range':
      setIfDefined(result, 'bmiRange', parseRange(value, 13, 83));
      break;

    case 'bmi':
      setIfDefined(result, 'bmiRange', parseMinMax(value, 13, 83));
      break;

    case 'spatial':
      setIfDefined(result, 'spatialSearches', parseSpatial(value));
      break;

    case 'consortiums':
      setIfDefined(result, 'consortiums', parseArray(value));
      break;

    case 'tmc':
    case 'providers':
      setIfDefined(result, 'tmc', parseArray(value));
      break;

    case 'technologies':
      setIfDefined(result, 'technologies', parseArray(value));
      break;

    case 'hra-versions':
      setIfDefined(result, 'hraVersions', parseArray(value));
      break;

    case 'ontologyterms':
    case 'ontology-terms':
      setIfDefined(result, 'ontologyTerms', parseArrayWithFilter(value, SKIPPABLE_AS));
      break;

    case 'celltypeterms':
    case 'cell-type-terms':
      setIfDefined(result, 'cellTypeTerms', parseArrayWithFilter(value, SKIPPABLE_CT));
      break;

    case 'biomarkerterms':
    case 'biomarker-terms':
      setIfDefined(result, 'biomarkerTerms', parseArrayWithFilter(value, SKIPPABLE_BM));
      break;

    case 'token':
      setIfDefined(result, 'sessionToken', parseSessionToken(value));
      break;
  }
}

// ----------------------
// API
// ----------------------

export function queryParametersToFilter(query) {
  const result = { ...FILTER_DEFAULTS };

  Object.entries(query).forEach(([key, value]) => processParameter(result, key, value));
  return result;
}
