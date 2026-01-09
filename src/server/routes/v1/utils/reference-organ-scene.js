import { getReferenceOrganScene } from '../../../../library/operations/v1.js';
import { queryParametersToFilter } from '../../../../library/v1/utils/parse-filter.js';
import { sparqlEndpoint } from '../../../environment.js';

function parseString(value) {
  return typeof value === 'string' ? value : undefined;
}

export function getReferenceOrganSceneHandler() {
  return async (req, res) => {
    const { query } = req;
    const organIri = parseString(query['organ-iri']);
    if (organIri) {
      const filter = queryParametersToFilter(query);
      const result = await getReferenceOrganScene(organIri, filter, sparqlEndpoint());
      res.json(result);
    } else {
      res.status(400).send('Must provide an organ-iri query parameter');
    }
  };
}
