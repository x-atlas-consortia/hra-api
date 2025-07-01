function termFilter(terms) {
  const quotedTerms = terms.map((s) => `(<${s}>)`).join(' ');
  return `
    FILTER EXISTS {
      VALUES (?term) { ${quotedTerms} }
      { ?term ?p1 [] . }
      UNION
      { [] ?p2 ?term . }
    }`;
}

function getFilterQuery(filter) {
  const { ontologyTerms, cellTypeTerms, biomarkerTerms } = filter;

  const filters = [];
  if (ontologyTerms?.length > 0) {
    filters.push(termFilter(ontologyTerms));
  }
  if (cellTypeTerms?.length > 0) {
    filters.push(termFilter(cellTypeTerms));
  }
  if (biomarkerTerms?.length > 0) {
    filters.push(termFilter(biomarkerTerms));
  }
  return filters.join('\n');
}

export async function filterSparqlQuery(sparqlQuery, filter = {}, endpoint = 'https://lod.humanatlas.io/sparql') {
  const sparqlFilter = getFilterQuery(filter, endpoint);
  const filteredQuery = sparqlQuery.replace('#{{FILTER}}', sparqlFilter);
  return filteredQuery;
}
