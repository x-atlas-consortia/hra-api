import ruiLocationsQuery from '../queries/construct-rui-locations.rq';

export function getRuiLocationsQuery(datasets, ruiLocations) {
  const datasetValues = datasets.reduce((vals, iri) => vals + ` (<${iri}>)`, '');
  const ruiLocationValues = ruiLocations.reduce((vals, iri) => vals + ` (<${iri}>)`, '');
  const dsVals = `VALUES (?dataset) { ${datasetValues} }`;
  const ruiVals = `VALUES (?rui_location) { ${ruiLocationValues} }`;
  return ruiLocationsQuery.replaceAll('#{{DATASET_VALUES}}', dsVals).replaceAll('#{{RUI_LOCATION_VALUES}}', ruiVals);
}
