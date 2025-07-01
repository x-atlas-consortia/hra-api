import { select } from '../../shared/utils/sparql';
import query from '../queries/do-search.rq';

function reformatResponse(records) {
  return records.map((row) => row.purl);
}

export async function doSearch(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  // Temporarily use a set sparql endpoint
  endpoint = 'https://lod.humanatlas.io/sparql';

  const filteredQuery = query.replace('#{{FILTER}}', getFilterQuery(filter));
  const results = reformatResponse(await select(filteredQuery, endpoint));
  return results;
}

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
