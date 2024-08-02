import { getExtractionSite } from '../../../../library/operations/v1.js';
import { sparqlEndpoint } from '../../../environment.js';

function parseString(value) {
  return typeof value === 'string' ? value : undefined;
}

export function getExtractionSiteHandler() {
  return async (req, res) => {
    const { query } = req;
    const iri = parseString(query['iri']);
    if (iri) {
      const result = await getExtractionSite({ iri }, sparqlEndpoint());
      if (result) {
        res.json(result);
      } else {
        res.status(404).send('Extraction site not found');
      }
    } else {
      res.status(404).send('Must provide an iri query parameter');
    }
  };
}
