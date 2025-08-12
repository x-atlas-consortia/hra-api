import { select } from '../../shared/utils/sparql';
import query from '../queries/asctb-term-occurences.rq';
import { filterSparqlQuery } from '../utils/filter-sparql-query';

function reformatResponse(records) {
  return records.reduce((acc, row) => ((acc[row['iri']] = row['count']), acc), {});
}

export async function getAsctbTermOccurences(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  // Temporarily use a set sparql endpoint
  endpoint = 'https://sparql.humanatlas.io/blazegraph/namespace/kb/sparql';

  const filteredQuery = await filterSparqlQuery(query, filter, endpoint);
  const results = reformatResponse(await select(filteredQuery, endpoint));
  return results;
}
