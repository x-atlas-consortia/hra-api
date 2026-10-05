import { getReferenceOrganScene } from '../../../../library/operations/v1.js';
import { queryParametersToFilter } from '../../../../library/v1/utils/parse-filter.js';
import { getQuery, handler } from '../../../utils/request.js';

function parseString(value) {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Creates a route handler that returns the scene of the reference organ given in the query parameters.
 */
export function getReferenceOrganSceneHandler() {
  return handler(async (req, res) => {
    const query = getQuery(req);
    const organIri = parseString(query['organ-iri']);
    if (organIri) {
      const filter = queryParametersToFilter(query);
      const result = await getReferenceOrganScene(organIri, filter, SPARQL_ENDPOINT);
      res.json(result);
    } else {
      res.text('Must provide an organ-iri query parameter', { status: 400 });
    }
  });
}
