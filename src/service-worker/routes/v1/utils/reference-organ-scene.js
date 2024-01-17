import { getReferenceOrganScene } from '../../../../library/operations/v1';
import { queryParametersToFilter } from '../../../../library/v1/utils/parse-filter';

function parseString(value) {
  return typeof value === 'string' ? value : undefined;
}

export function getReferenceOrganSceneHandler() {
  return async (req, res) => {
    const { query } = req;
    const organIri = parseString(query['organ-iri']);
    if (organIri) {
      const filter = queryParametersToFilter(query);
      const result = await getReferenceOrganScene(organIri, filter, SPARQL_ENDPOINT);
      res.json(result);
    } else {
      res.status(404).send('Must provide an organ-iri query parameter');
    }
  };
}
