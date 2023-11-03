/**
 * Default filter values.
 */
const FILTER_DEFAULTS = {
  sex: undefined,
  minAge: undefined,
  maxAge: undefined,
  minBMI: undefined,
  maxBMI: undefined,
  tmc: [],
  technologies: [],
  ontologyTerms: [],
  cellTypeTerms: [],
  spatialSearches: [],
  consortiums: [],
};

/**
 * Clamps a value within a given range.
 *
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
function clamp(value, min, max) {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  }

  return value;
}

/**
 * Sets a property on an object if the value is defined (not undefined).
 *
 * @param {Object} obj - The object to set the property on.
 * @param {string} prop - The property name.
 * @param {*} value - The value to set.
 */
function setIfDefined(obj, prop, value) {
  if (value !== undefined) {
    obj[prop] = value;
  }
}

/**
 * Parses the sex parameter.
 *
 * @param {string} value - The sex value to parse.
 * @returns {string|undefined} The parsed sex value.
 */
function parseSex(value) {
  const values = ["Female", "Male"];
  value = typeof value === "string" ? value.toLowerCase() : value;
  return values.find((v) => v.toLowerCase() === value);
}

/**
 * Parses a range parameter.
 *
 * @param {string|string[]} value - The range value to parse.
 * @param {number} min - The minimum value for the range.
 * @param {number} max - The maximum value for the range.
 * @returns {number[]|undefined} The parsed range as [min, max].
 */
function parseRange(value, min, max) {
  if (typeof value === "string") {
    value = value.includes(",") ? value.split(",") : [value, value];
  }

  if (Array.isArray(value)) {
    let low = Number(value[0] || "NaN");
    let high = Number(value[1] || "NaN");

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

/**
 * Parses a range parameter with min and max properties.
 *
 * @param {object} value - The range value to parse.
 * @param {number} min - The minimum value for the range.
 * @param {number} max - The maximum value for the range.
 * @returns {number[]|undefined} The parsed range as [min, max].
 */
function parseMinMaxRange(value, min, max) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return parseRange([value?.["min"], value?.["max"]], min, max);
}

/**
 * Parses a spatial parameter.
 *
 * @param {string|object} value - The spatial value to parse.
 * @returns {object[]|undefined} The parsed spatial value.
 */
function parseSpatial(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (typeof value === "object") {
    const numericSpatialAttributes = new Set(["x", "y", "z", "radius"]);
    let searches = undefined;
    for (const [key, valueOrValues] of Object.entries(value)) {
      const values = Array.isArray(valueOrValues)
        ? valueOrValues
        : [valueOrValues];
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

/**
 * Parses an array parameter, optionally excluding a specific value.
 *
 * @param {string|string[]} value - The array value to parse.
 * @param {string} excludeValue - The value to exclude from the parsed array.
 * @returns {string[]|undefined} The parsed array.
 */
function parseArray(value, excludeValue) {
  if (typeof value === "string") {
    const values = value.includes(",") ? value.split(",") : [value];
    const filteredValues = values.filter((val) => val !== excludeValue);
    return filteredValues.length > 0 ? filteredValues : undefined;
  }
  return Array.isArray(value) ? value : undefined;
}

/**
 * Processes a query parameter and updates the filter object accordingly.
 *
 * @param {object} result - The filter object to update.
 * @param {string} key - The parameter key.
 * @param {*} value - The parameter value.
 */
function processParameter(result, key, value) {
  let minAge, maxAge, minBMI, maxBMI;
  switch (key.toLowerCase()) {
    case "sex":
      setIfDefined(result, "sex", parseSex(value));
      break;

    case "agerange":
    case "age-range":
      [minAge, maxAge] = parseRange(value, 1, 110);
      setIfDefined(result, "minAge", minAge);
      setIfDefined(result, "maxAge", maxAge);
      break;

    case "age":
      [minAge, maxAge] = parseRange(value, 1, 110);
      setIfDefined(result, "minAge", minAge);
      setIfDefined(result, "maxAge", maxAge);
      break;

    case "bmirange":
    case "bmi-range":
      [minBMI, maxBMI] = parseRange(value, 13, 83);
      setIfDefined(result, "minBMI", minBMI);
      setIfDefined(result, "maxBMI", maxBMI);
      break;

    case "bmi":
      [minBMI, maxBMI] = parseMinMaxRange(value, 13, 83);
      setIfDefined(result, "minBMI", minBMI);
      setIfDefined(result, "maxBMI", maxBMI);
      break;

    case "spatial":
      setIfDefined(result, "spatialSearches", parseSpatial(value));
      break;

    case "tmc":
    case "providers":
      setIfDefined(result, "tmc", parseArray(value));
      break;

    case "technologies":
      setIfDefined(result, "technologies", parseArray(value));
      break;

    case "ontologyterms":
    case "ontology-terms":
      setIfDefined(
        result,
        "ontologyTerms",
        parseArray(value, "http://purl.obolibrary.org/obo/UBERON_0013702"),
      );
      break;

    case "celltypeterms":
    case "cell-type-terms":
      setIfDefined(
        result,
        "cellTypeTerms",
        parseArray(value, "http://purl.obolibrary.org/obo/CL_0000000"),
      );
      break;

    case "consortiums":
      setIfDefined(result, "consortiums", parseArray(value));
      break;
  }
}

/**
 * Converts query parameters to a filter object.
 *
 * @param {object} query - The query parameters object.
 * @returns {object} The filter object.
 */
export function queryParametersToFilter(query) {
  const result = { ...FILTER_DEFAULTS };

  for (const key in query) {
    processParameter(result, key, query[key]);
  }

  return result;
}
