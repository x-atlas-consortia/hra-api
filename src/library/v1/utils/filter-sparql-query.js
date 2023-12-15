export function filterSparqlQuery(sparqlQuery, filter = {}) {
  const { ontologyTerms, cellTypeTerms, biomarkerTerms, minAge, maxAge, minBMI, maxBMI, sex, technology, tmc, consortiums } = filter;
  let sparqlFilter = '';
  if (sex != undefined) {
    sparqlFilter += `
        FILTER(?sex = "${sex}")
      `;
  }
  if (minAge && maxAge) {
    sparqlFilter += `
          FILTER (?age > ${minAge} && ?age < ${maxAge})
        `;
  } else {
    if (minAge != undefined) {
      sparqlFilter += `
          FILTER (?age > ${minAge})
        `;
    }
    if (maxAge != undefined) {
      sparqlFilter += `
          FILTER (?age < ${maxAge})
        `;
    }
  }
  if (minBMI && maxBMI) {
    sparqlFilter += `
          FILTER (?bmi > ${minBMI} && ?bmi < ${maxBMI})
        `;
  } else {
    if (minBMI != undefined) {
      sparqlFilter += `
          FILTER (?bmi > ${minBMI})
        `;
    }
    if (maxBMI != undefined) {
      sparqlFilter += `
          FILTER (?bmi < ${maxBMI})
        `;
    }
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
  if (technology?.length > 0) {
    const technologies = technology.map((s) => `"${s}"`).join(',');
    sparqlFilter += `
        FILTER(?technology IN (${technologies}))
      `;
  }
  if (consortiums?.length > 0) {
    const terms = consortiums.map((s) => `"${s}"`).join(' ');
    sparqlFilter += `
        FILTER(?consortium IN (${terms}))
      `;
  }
  return sparqlQuery.replace('#{{FILTER}}', sparqlFilter);
}
