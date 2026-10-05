import { sparqlBackend } from '../../shared/utils/sparql.js';
import ruiLocationsBlazegraphQuery from '../queries/construct-rui-locations-blazegraph.rq';
import ruiLocationsQuery from '../queries/construct-rui-locations.rq';

export function getRuiLocationsQuery(datasets, ruiLocations) {
  const datasetValues = datasets.reduce((vals, iri) => vals + ` (<${iri}>)`, '');
  const ruiLocationValues = ruiLocations.reduce((vals, iri) => vals + ` (<${iri}>)`, '');
  const dsVals = `VALUES (?dataset) { ${datasetValues} }`;
  const ruiVals = `VALUES (?rui_location) { ${ruiLocationValues} }`;
  // Blazegraph is too slow with the default query (see construct-rui-locations.rq)
  const query = sparqlBackend() === 'blazegraph' ? ruiLocationsBlazegraphQuery : ruiLocationsQuery;
  return query.replaceAll('#{{DATASET_VALUES}}', dsVals).replaceAll('#{{RUI_LOCATION_VALUES}}', ruiVals);
}
