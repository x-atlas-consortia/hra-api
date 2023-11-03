import { readFileSync } from "fs";
import { filterSparqlQuery } from "../utils/filter-sparql-query.js";
import { constructJsonLd, selectRemoteObjects } from "./sparql.js";

// SPARQL endpoint to query
const sparqlEndpoint = "https://lod.humanatlas.io/sparql";

/**
 * Executes a filtered SPARQL query.
 * @param {string} sparqlFile - The path to the SPARQL query file.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Array>} - A promise that resolves to an array of query results.
 */
async function executeFilteredQuery(sparqlFile, filter) {
  const sparqlQueryTemplate = readFileSync(sparqlFile).toString();
  try {
    // Get results as an array of objects
    const sparqlQuery = filterSparqlQuery(sparqlQueryTemplate, filter);
    const results = await selectRemoteObjects(sparqlQuery, sparqlEndpoint);
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Executes a filtered SPARQL construct query and applies JSON-LD framing.
 * @param {string} sparqlFile - The path to the SPARQL query file.
 * @param {Object} filter - An object containing query filters.
 * @param {string} jsonFrame - The path to the JSON-LD framing configuration file.
 * @returns {Promise<Object>} - A promise that resolves to the constructed JSON-LD data.
 */
async function executeFilteredConstructQuery(sparqlFile, filter, jsonFrame) {
  const sparqlQueryTemplate = readFileSync(sparqlFile).toString();
  const frameObj = JSON.parse(readFileSync(jsonFrame).toString());

  try {
    // Get results as an array of objects
    const sparqlQuery = filterSparqlQuery(sparqlQueryTemplate, filter);
    const results = await constructJsonLd(
      sparqlQuery,
      sparqlEndpoint,
      frameObj,
    );
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Generates the full path to a SPARQL query file.
 * @param {string} filename - The name of the SPARQL query file.
 * @returns {string} - The full path to the query file.
 */
function getSparqlFilePath(filename) {
  return `routes/v1/queries/${filename}`;
}

/**
 * Retrieves the database status.
 * @param {Object} filter - An object containing query filters (unused).
 * @returns {Object} - An object containing database status information.
 */
export async function getDbStatus(filter) {
  try {
    const results = {
      status: "Ready",
      message: "Database successfully loaded",
      checkback: 3600000,
      loadTime: 22594,
      timestamp: new Date().toISOString(),
    };

    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Retrieves dataset technology names.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Array>} - A promise that resolves to an array of technology names.
 */
export async function getDatasetTechnologyNames(filter) {
  try {
    const queryFilePath = getSparqlFilePath("dataset-technology-names.rq");
    const results = await executeFilteredQuery(queryFilePath, filter);
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Retrieves tissue provider names.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Array>} - A promise that resolves to an array of tissue provider names.
 */
export async function getTissueProviderNames(filter) {
  try {
    const queryFilePath = getSparqlFilePath("tissue-provider-names.rq");
    const results = await executeFilteredQuery(queryFilePath, filter);
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Retrieves ontology term occurrences.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to ontology term occurrences.
 */
export async function getOntologyTermOccurences(filter) {
  try {
    const queryFilePath = getSparqlFilePath("ontology-term-occurences.rq");
    const jsonFrame = getSparqlFilePath(
      "jsonld-frames/ontology-term-occurences.jsonld",
    );
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results["@graph"].reduce(
      (acc, row) => ((acc[row["@id"]] = parseInt(row["count"])), acc),
      {},
    );
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Retrieves cell type term occurrences.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to cell type term occurrences.
 */
export async function getCellTypeTermOccurences(filter) {
  try {
    const queryFilePath = getSparqlFilePath("cell-type-term-occurences.rq");
    const jsonFrame = getSparqlFilePath(
      "jsonld-frames/cell-type-term-occurences.jsonld",
    );
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );

    return results["@graph"].reduce(
      (acc, row) => ((acc[row["@id"]] = parseInt(row["count"])), acc),
      {},
    );
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves ontology term occurrences.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to ontology term occurrences.
 */
export async function getBiomarkerTermOccurences(filter) {
  try {
    const queryFilePath = getSparqlFilePath("biomarker-term-occurences.rq");
    const jsonFrame = getSparqlFilePath(
      "jsonld-frames/biomarker-term-occurences.jsonld",
    );
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results["@graph"].reduce(
      (acc, row) => ((acc[row["@id"]] = parseInt(row["count"])), acc),
      {},
    );
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves reference organs.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to reference organ data.
 */
export async function getReferenceOrgans(filter) {
  try {
    const queryFilePath = getSparqlFilePath("reference-organs.rq");
    const jsonFrame = getSparqlFilePath(
      "jsonld-frames/reference-organs.jsonld",
    );
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Retrieves tissue blocks.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to tissue block data.
 */
export async function getTissueBlocks(filter) {
  try {
    const queryFilePath = getSparqlFilePath("tissue-blocks.rq");
    const jsonFrame = getSparqlFilePath("jsonld-frames/tissue-blocks.jsonld");
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves the ontology tree model.
 *
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to the ontology tree model.
 */
export async function getOntologyTreeModel(filter) {
  try {
    const queryFilePath = getSparqlFilePath("ontology-tree-model.rq");
    const jsonFrame = getSparqlFilePath("jsonld-frames/ontology-frame.jsonld");
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves the ontology tree model.
 *
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to the ontology tree model.
 */
export async function getBiomarkerTreeModel(filter) {
  try {
    const queryFilePath = getSparqlFilePath("biomarker-tree-model.rq");
    const jsonFrame = getSparqlFilePath("jsonld-frames/biomarker-frame.jsonld");
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves the cell type tree model.
 *
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to the cell type tree model.
 */
export async function getCellTypeTreeModel(filter) {
  try {
    const queryFilePath = getSparqlFilePath("celltype-tree-model.rq");
    const jsonFrame = getSparqlFilePath("jsonld-frames/celltype-frame.jsonld");
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Retrieves RUI locations.
 *
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to RUI location data.
 */
export async function getRuiLocations(filter) {
  try {
    const queryFilePath = getSparqlFilePath("rui-locations.rq");
    const jsonFrame = getSparqlFilePath("jsonld-frames/rui-locations.jsonld");
    const results = await executeFilteredConstructQuery(
      queryFilePath,
      filter,
      jsonFrame,
    );
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}

/**
 * Retrieves aggregate results.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Array>} - A promise that resolves to an array of aggregate results.
 */
export async function getAggregateResults(filter) {
  try {
    const queryFilePath = getSparqlFilePath("aggregate-results.rq");
    const results = await executeFilteredQuery(queryFilePath, filter);
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves scene data.
 * @param {Object} filter - An object containing query filters (unused).
 * @returns {Array} - An empty array as scene data.
 */
export async function getScene(filter) {
  try {
    const results = [];
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves scene data.
 * @param {Object} filter - An object containing query filters (unused).
 * @returns {Array} - An empty array as scene data.
 */
export async function getReferenceOrganScene(filter) {
  try {
    const results = [];
    return results;
  } catch (error) {
    console.error("Error executing SPARQL query:", error.message);
  }
}
/**
 * Retrieves HuBMAP RUI locations.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to HuBMAP RUI location data.
 */
export async function getHubmapRuiLocations(filter) {
  return getRuiLocations({ ...filter, consortiums: ["HuBMAP"] });
}

/**
 * Retrieves GTEx RUI locations.
 * @param {Object} filter - An object containing query filters.
 * @returns {Promise<Object>} - A promise that resolves to GTEx RUI location data.
 */
export async function getGtexRuiLocations(filter) {
  return getRuiLocations({ ...filter, consortiums: ["GTEx"] });
}
