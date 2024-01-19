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

// ----------------------
// Parsers
// ----------------------

function clamp(value, min, max) {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  }

  return value;
}

function setIfDefined(obj, prop, value) {
  if (value !== undefined) {
    obj[prop] = value;
  }
}

// ----------------------
// Parsers
// ----------------------

function parseSex(value) {
  const values = ['Both', 'Female', 'Male'];

  value = typeof value === 'string' ? value.toLowerCase() : value;
  return values.find((v) => v.toLowerCase() === value);
}

function parseRange(value, min, max) {
  if (typeof value === 'string') {
    value = value.includes(',') ? value.split(',') : [value, value];
  }

  if (Array.isArray(value)) {
    let low = Number(value[0] || 'NaN');
    let high = Number(value[1] || 'NaN');

    if (isNaN(low) && isNaN(high)) {
      return undefined;
    }

    low = isNaN(low) ? min : low;
    high = isNaN(high) ? max : high;
    if (low > high) {
      [low, high] = [high, low];
    }

    low = clamp(low, min, max);
    high = clamp(high, min, max);
    return [low, high];
  }

  return undefined;
}

function parseMinMaxRange(value, min, max) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return parseRange([value?.['min'], value?.['max']], min, max);
}

function parseArray(value) {
  if (typeof value === 'string') {
    return value.includes(',') ? value.split(',') : [value];
  }

  return Array.isArray(value) ? value : undefined;
}

function parseSpatial(value) {
  // Spatial may be specified as a JSON string
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object') {
    const numericSpatialAttributes = new Set(['x', 'y', 'z', 'radius']);
    let searches = undefined;
    for (const [key, valueOrValues] of Object.entries(value)) {
      const values = Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues];
      if (Array.isArray(values)) {
        if (!searches) {
          searches = values.map((_) => ({}));
        }
        values.forEach((val, index) => {
          if (searches && searches.length > index) {
            if (numericSpatialAttributes.has(key)) {
              val = +val;
            }
            searches[index][key] = val;
          }
        });
      }
    }
    return searches;
  }
  return undefined;
}

// ----------------------
// Implementation
// ----------------------

function processParameter(result, key, value) {
  switch (key.toLowerCase()) {
    case 'sex':
      setIfDefined(result, 'sex', parseSex(value));
      break;

    case 'agerange':
    case 'age-range':
      setIfDefined(result, 'ageRange', parseRange(value, 1, 110));
      break;

    case 'age':
      setIfDefined(result, 'ageRange', parseMinMaxRange(value, 1, 110));
      break;

    case 'bmirange':
    case 'bmi-range':
      setIfDefined(result, 'bmiRange', parseRange(value, 13, 83));
      break;

    case 'bmi':
      setIfDefined(result, 'bmiRange', parseMinMaxRange(value, 13, 83));
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

    case 'ontologyterms':
    case 'ontology-terms':
      setIfDefined(result, 'ontologyTerms', parseArray(value));
      break;

    case 'celltypeterms':
    case 'cell-type-terms':
      setIfDefined(result, 'cellTypeTerms', parseArray(value));
      break;

    case 'biomarkerterms':
    case 'biomarker-terms':
      setIfDefined(result, 'biomarkerTerms', parseArray(value));
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
