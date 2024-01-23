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
  const filters = {
    donor: [],
    rui_location: [],
    dataset: [],
    sectionDataset: [],
  };
  if (sex && sex !== 'Both') {
    filters.donor.push(`?donor ccf:sex ?sex . FILTER(?sex = "${sex}")`);
  }
  if (ageRange) {
    filters.donor.push(`?donor ccf:age ?age . FILTER (?age > ${ageRange[0]} && ?age < ${ageRange[1]})`);
  }
  if (bmiRange) {
    filters.donor.push(`?donor ccf:bmi ?bmi . FILTER (?bmi > ${bmiRange[0]} && ?bmi < ${bmiRange[1]})`);
  }
  if (ontologyTerms?.length > 0) {
    const terms = ontologyTerms.map((s) => `<${s}>`).join(', ');
    filters.rui_location.push(`
      {
        ?rui_location ccf:collides_with ?anatomical_structure .
      }
      UNION
      {
        ?rui_location ccf:collides_with [
          ccf:ccf_part_of ?anatomical_structure
        ] .
      }
      FILTER(?anatomical_structure IN (${terms}))`);
  }
  if (cellTypeTerms?.length > 0) {
    const terms = cellTypeTerms.map((s) => `<${s}>`).join(', ');
    filters.rui_location.push(`
      ?rui_location ccf:collides_with [
        ^ccf:ccf_located_in ?cell_type
      ] .
      FILTER(?cell_type IN (${terms}))`);
  }
  if (biomarkerTerms?.length > 0) {
    const terms = biomarkerTerms.map((s) => `<${s}>`).join(', ');
    filters.rui_location.push(`
      ?rui_location ccf:collides_with [
        ^ccf:ccf_bm_located_in ?biomarker
      ] .
      FILTER(?biomarker IN (${terms}))`);
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
      ?sample ccf:generates_dataset ?dataset ;
              ccf:sample_type ?sampleType .
      ?dataset ccf:technology ?technology .
      FILTER(?sampleType = "Tissue Block" && ?technology IN (${technologiesString}) )`);
    filters.sectionDataset.push(`
      ?section ccf:generates_dataset ?sectionDataset ;
              ccf:sample_type ?sampleType .
      ?sectionDataset ccf:technology ?sectionTechnology .
      FILTER(?sampleType = "Tissue Section" && ?sectionTechnology IN (${technologiesString}))`);
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
      filters.rui_location.push(`?block ccf:has_registration_location ?rui_location . FILTER(?rui_location = <https://no-extraction-sites-found.com/>)`);
    } else {
      const sites = [...results].map((s) => `<${s}>`).join(', ');
      filters.rui_location.push(`?block ccf:has_registration_location ?rui_location . FILTER(?rui_location IN (${sites}))`);
    }
  }
  let sparqlFilter = '';
  if (filters.donor.length > 0) {
    sparqlFilter += `
    FILTER (BOUND(?donor) && EXISTS {
      SELECT DISTINCT ?donor
      WHERE {
        ${filters.donor.join('\n')}
      }
    })`;
  }
  if (filters.dataset.length > 0) {
    sparqlFilter += `
    FILTER (
      (BOUND(?dataset) && EXISTS {
        SELECT DISTINCT ?dataset
        WHERE {
          ${filters.dataset.join('\n')}
        }
      }) || 
      (BOUND(?sectionDataset) && EXISTS {
        SELECT DISTINCT ?sectionDataset
        WHERE {
          ${filters.sectionDataset.join('\n')}
        }
      })
    )`;
  }
  if (filters.rui_location.length) {
    sparqlFilter += `
    FILTER (BOUND(?rui_location) && EXISTS {
      SELECT DISTINCT ?rui_location
      WHERE {
        ${filters.rui_location.join('\n')}
      }
    })`;
  }
  return sparqlQuery.replace('#{{FILTER}}', sparqlFilter);
}
