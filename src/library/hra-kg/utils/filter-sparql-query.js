function termFilter(terms) {
  const quotedTerms = terms.map((s) => `(<${s}>)`).join(' ');
  return `
    GRAPH HRA: {
      VALUES (?term) { ${quotedTerms} }
      ?term dct:isReferencedBy ?purl .
    }`;
}

function hraVersionFilter(versions) {
  const quotedVersions = versions.map((v) => `'${v}'`).join(', ');
  return `
    FILTER EXISTS {
      GRAPH LOD: {
        [] a dcat:Dataset ;
          	schema:version ?version ;
            rdfs:seeAlso ?graphPurlVersioned .
        [] a dcat:Dataset ;
            schema:additionalType ?hraType ;
            schema:name ?hraName ;
            schema:version ?hraVersion ;
            prov:hadMember ?graphPurlVersioned .
        FILTER(?hraType = 'collection' && ?hraName = 'hra' && ?hraVersion IN (${quotedVersions}))
        BIND(IRI(STRBEFORE(STR(?graphPurlVersioned), CONCAT('/', ?version))) as ?purl)
      }
    }
  `;
}

function getFilterQuery(filter) {
  const { ontologyTerms, cellTypeTerms, biomarkerTerms, hraVersions } = filter;

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
  if (hraVersions?.length > 0) {
    filters.push(hraVersionFilter(hraVersions));
  }
  return filters.join('\n');
}

export async function filterSparqlQuery(sparqlQuery, filter = {}, endpoint = 'https://lod.humanatlas.io/sparql') {
  const sparqlFilter = getFilterQuery(filter, endpoint);
  const filteredQuery = sparqlQuery.replace('#{{FILTER}}', sparqlFilter);
  return filteredQuery;
}
