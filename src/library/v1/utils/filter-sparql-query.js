export function filterSparqlQuery(sparqlQuery, filter = {}) {
  const { ontologyTerms, cellTypeTerms, biomarkerTerms, ageRange, bmiRange, sex, technologies, tmc, consortiums } =
    filter;
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
  // FIXME: queries require an enriched relationship: ccf:biomarker_located_in
  // if (biomarkerTerms?.length > 0) {
  //   const terms = biomarkerTerms
  //     .map((s) => {
  //       if (s === 'http://purl.org/ccf/biomarkers') {
  //         s = 'http://purl.org/ccf/Biomarker';
  //       }
  //       return `<${s}>`;
  //     })
  //     .join(' ');
  //   sparqlFilter += `
  //       FILTER(?biomarker IN (${terms}))
  //     `;
  // }
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
  return sparqlQuery.replace('#{{FILTER}}', sparqlFilter);
}
