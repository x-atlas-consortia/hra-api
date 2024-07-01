import { getSpatialGraph } from '../../shared/spatial/spatial-graph.js';
import baseSubQuery from '../queries/base-subquery.rq';

async function getFilterQuery(filter, endpoint) {
  const {
    ontologyTerms,
    cellTypeTerms,
    biomarkerTerms,
    ageRange,
    bmiRange,
    sex,
    technologies,
    tmc,
    consortiums,
    spatialSearches,
  } = filter;
  const filters = {
    donor: [],
    rui_location: [],
    dataset: [],
    sectionDataset: [],
  };

  if (sex && sex !== 'Both') {
    filters.donor.push(`
      ?donor ccf:sex ?sex .
      FILTER(?sex = "${sex}")`);
  }
  if (ageRange) {
    filters.donor.push(`
      ?donor ccf:age ?age .
      FILTER (?age > ${ageRange[0]} && ?age < ${ageRange[1]})`);
  }
  if (bmiRange) {
    filters.donor.push(`
      ?donor ccf:bmi ?bmi .
      FILTER (?bmi > ${bmiRange[0]} && ?bmi < ${bmiRange[1]})`);
  }
  if (ontologyTerms?.length > 0) {
    const terms = ontologyTerms.map((s) => `<${s}>`).join(', ');
    filters.rui_location.push(`
      GRAPH DSGraphsExtra: {
        ?rui_location ccf:collides_with ?anatomical_structure .
        FILTER(?anatomical_structure IN (${terms}))
      }`);
  }
  if (cellTypeTerms?.length > 0) {
    const terms = cellTypeTerms.map((s) => `<${s}>`).join(', ');
    filters.rui_location.push(`
      GRAPH DSGraphsExtra: {
        ?rui_location ccf:collides_with_ct ?cell_type .
        FILTER(?cell_type IN (${terms}))
      }`);
  }
  if (biomarkerTerms?.length > 0) {
    const terms = biomarkerTerms.map((s) => `<${s}>`).join(', ');
    filters.rui_location.push(`
      GRAPH DSGraphsExtra: {
        ?rui_location ccf:collides_with_bm ?biomarker .
        FILTER(?biomarker IN (${terms}))
      }`);
  }
  if (tmc?.length > 0) {
    const providers = tmc.map((s) => `"${s}"`).join(', ');
    filters.donor.push(`
      ?donor ccf:tissue_provider_name ?provider .
      FILTER(?provider IN (${providers}))`);
  }
  if (technologies?.length > 0) {
    const technologiesString = technologies.map((s) => `"${s}"`).join(', ');
    filters.dataset.push(`
      ?dataset ccf:technology ?technology .
      FILTER(?technology IN (${technologiesString}) )`);
    filters.sectionDataset.push(`
      ?sectionDataset ccf:technology ?sectionTechnology .
      FILTER(?sectionTechnology IN (${technologiesString}))`);
  }
  if (consortiums?.length > 0) {
    const terms = consortiums.map((s) => `"${s}"`).join(', ');
    filters.donor.push(`
      ?donor ccf:consortium_name ?consortium .
      FILTER(?consortium IN (${terms}))`);
  }
  if (spatialSearches?.length > 0) {
    const spatialGraph = await getSpatialGraph(endpoint);
    let results = new Set();
    for (const search of spatialSearches) {
      results = spatialGraph.probeExtractionSites(search, results);
    }
    if (results.size === 0) {
      filters.rui_location.push(`
        ?block ccf:has_registration_location ?rui_location .
        FILTER(?rui_location = <https://no-extraction-sites-found.com/>)`);
    } else {
      const sites = [...results].map((s) => `<${s}>`).join(', ');
      filters.rui_location.push(`
        ?block ccf:has_registration_location ?rui_location .
        FILTER(?rui_location IN (${sites}))`);
    }
  }

  if (Object.values(filters).filter((s) => s.length > 0).length > 0) {
    const entityQuery = baseSubQuery
      .slice(baseSubQuery.indexOf('#START-SUBQUERY'))
      .replace('#{{FILTER}}', filters.donor.concat(filters.rui_location).join('\n'))
      .replace('#{{DATASET_FILTER}}', filters.dataset.join('\n'))
      .replace('#{{SECTION_FILTER}}', filters.sectionDataset.join('\n'))
      .replace('OPTIONAL { #DATASETS', filters.dataset.length === 0 ? 'OPTIONAL {' : '{')
      .replace('OPTIONAL { #SECTIONS', filters.sectionDataset.length === 0 ? 'OPTIONAL {' : '{')
      .replace('#hint:SubQuery', 'hint:SubQuery');
    return `{
      ${entityQuery}
    }`;
  } else {
    return '';
  }
}

function setDatasetGraph(filter, query) {
  if (filter.sessionToken) {
    const token = filter.sessionToken;
    const dsGraph = `urn:hra-api:${token}:ds-graph`;
    query = query.replace(
      'PREFIX DSGraphs: <https://purl.humanatlas.io/collection/ds-graphs>',
      `PREFIX DSGraphs: <${dsGraph}>`
    );
  }
  return query;
}

export async function filterSparqlQuery(sparqlQuery, filter = {}, endpoint = 'https://lod.humanatlas.io/sparql') {
  const sparqlFilter = await getFilterQuery(filter, endpoint);
  const filteredQuery = setDatasetGraph(filter, sparqlQuery.replace('#{{FILTER}}', sparqlFilter));
  return filteredQuery;
}
