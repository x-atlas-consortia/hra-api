import { getExtractionSite } from '../../../../library/operations/v1.js';
import { getQuery, handler } from '../../../utils/request.js';

function parseString(value) {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Creates a route handler that returns the extraction site with the iri given in the query parameters.
 */
export function getExtractionSiteHandler() {
  return handler(async (req, res) => {
    const iri = parseString(getQuery(req)['iri']);
    if (iri) {
      const result = await getExtractionSite({ iri }, SPARQL_ENDPOINT);
      if (result) {
        res.json(result);
      } else {
        res.text('Extraction site not found', { status: 404 });
      }
    } else {
      res.text('Must provide an iri query parameter', { status: 404 });
    }
  });
}
