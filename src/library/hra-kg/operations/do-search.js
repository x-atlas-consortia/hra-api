import { select } from '../../shared/utils/sparql';
import query from '../queries/do-search.rq';
import { filterSparqlQuery } from '../utils/filter-sparql-query';

function reformatResponse(records) {
  return records.map((row) => row.purl);
}

export async function doSearch(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  // Temporarily use a set sparql endpoint
  endpoint = 'https://sparql.humanatlas.io/blazegraph/namespace/kb/sparql';

  const filteredQuery = await filterSparqlQuery(query, filter, endpoint);
  const results = reformatResponse(await select(filteredQuery, endpoint));
  return results;
}
