import { getSpatialGraph } from '../../shared/spatial/spatial-graph.js';

export async function filterSparqlQuery(sparqlQuery, filter = {}, endpoint = 'https://lod.humanatlas.io/sparql') {
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
  let sparqlFilter = '';
  if (sex && sex !== 'Both') {
    sparqlFilter += `
        FILTER(?sex = "${sex}")
      `;
  }
  if (ageRange) {
    sparqlFilter += `
          FILTER (?age > ${ageRange[0]} && ?age < ${ageRange[1]})
        `;
  }
  if (bmiRange) {
    sparqlFilter += `
          FILTER (?bmi > ${bmiRange[0]} && ?bmi < ${bmiRange[1]})
        `;
  }
  if (ontologyTerms?.length > 0) {
    const terms = ontologyTerms.map((s) => `<${s}>`).join(' ');
    sparqlFilter += `
        FILTER(?anatomical_structure IN (${terms}))
      `;
  }
  if (cellTypeTerms?.length > 0) {
    const terms = cellTypeTerms.map((s) => `<${s}>`).join(' ');
    sparqlFilter += `
        FILTER(?cell_type IN (${terms}))
      `;
  }
  if (biomarkerTerms?.length > 0) {
    const terms = biomarkerTerms.map((s) => `<${s}>`).join(' ');
    sparqlFilter += `
        FILTER(?biomarker IN (${terms}))
      `;
  }
  if (tmc?.length > 0) {
    const providers = tmc.map((s) => `"${s}"`).join(',');
    sparqlFilter += `
        FILTER(?provider IN (${providers}))
      `;
  }
  if (technologies?.length > 0) {
    const technologiesString = technologies.map((s) => `"${s}"`).join(',');
    sparqlFilter += `
        FILTER(?technology IN (${technologiesString}))
      `;
  }
  if (consortiums?.length > 0) {
    const terms = consortiums.map((s) => `"${s}"`).join(' ');
    sparqlFilter += `
        FILTER(?consortium IN (${terms}))
      `;
  }
  if (spatialSearches?.length > 0) {
    const spatialGraph = await getSpatialGraph(endpoint);
    let results = new Set();
    for (const search of spatialSearches) {
      results = spatialGraph.probeExtractionSites(search, results);
    }
    if (results.size === 0) {
      sparqlFilter += `
        FILTER(?rui_location = <https://no-extraction-sites-found.com/>)
      `;
    } else {
      const sites = [...results].map((s) => `<${s}>`).join(' ');
      `
      FILTER(?rui_location IN (${sites}))
      `;
    }
  }
  return sparqlQuery.replace('#{{FILTER}}', sparqlFilter);
}
