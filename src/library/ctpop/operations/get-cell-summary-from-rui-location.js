import { getCollisions } from '../utils/collisions.js';
import { select } from '../../utils/sparql.js';
import asWeightedCellSummariesQuery from '../queries/as-weighted-cell-summaries.rq'

function getAnatomicalStructureWeights(collisions) {
  return collisions.reduce((asWeights, c) => {
    const iri = c.representation_of;
    const percent = c.percentage_of_tissue_block;
    asWeights[iri] = (asWeights[iri] ?? 0) + percent;
    return asWeights;
  }, {});
}

function getCellSummaryQuery(asWeights) {
  const values = Object.entries(asWeights).reduce((vals, [iri, weight]) => vals + ` (<${iri}> ${weight})`, '');
  const asWeightVals = `VALUES (?as ?weight) { ${values} }`
  return asWeightedCellSummariesQuery.replaceAll('#{{AS_WEIGHT_VALUES}}', asWeightVals);
}

export async function getCellSummary(ruiLocation, endpoint = 'https://lod.humanatlas.io/sparql') {
  const collisions = await getCollisions(ruiLocation);
  if (collisions.length === 0) {
    return [];
  } else {
    const asWeights = getAnatomicalStructureWeights(collisions);
    const query = getCellSummaryQuery(asWeights);
    const summary = await select(query, endpoint);
    return summary;  
  }
}
