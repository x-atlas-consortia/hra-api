import { construct, select } from '../../shared/utils/sparql.js';
import ruiLocationsFrame from '../../v1/frames/rui-locations.jsonld';
import cellSummariesQuery from '../queries/select-cell-summaries.rq';
import { getCellDistributionSimilarity } from './cell-summary-similarity.js';
import { getRuiLocationsQuery } from './rui-locations-query.js';

function getCellSummariesQuery(cellWeights, organIri) {
  const values = Object.keys(cellWeights).reduce((vals, iri) => vals + ` (<${iri}>)`, '');
  const valString = `VALUES (?cell_id) { ${values} }`;
  let query = cellSummariesQuery.replaceAll('#{{VALUES}}', valString);
  if (organIri) {
    const organValues = `VALUES (?organ_iri) { (<${organIri}>) }`;
    query = query.replaceAll('#{{ORGAN_IRIs}}', organValues);
  }
  return query;
}

function getSourceSimilarities(cellWeights, summaries) {
  const sources = summaries.reduce((lookup, row) => {
    const id = `${row.cell_source}$${row.modality}`;
    if (!lookup[id]) {
      lookup[id] = {
        cell_source: row.cell_source,
        cell_source_type: row.cell_source_type,
        cell_source_label: row.cell_source_label,
        modality: row.modality,
        cellWeights: {},
      };
    }
    const source = lookup[id];
    source.cellWeights[row.cell_id] = row.percentage;
    return lookup;
  }, {});

  for (const source of Object.values(sources)) {
    source.similarity = getCellDistributionSimilarity(cellWeights, source.cellWeights);
    delete source.cellWeights;
  }

  return Object.values(sources).sort((a, b) => b.similarity - a.similarity);
}

export async function getSimilarCellSources(cellWeights, organIri, endpoint = 'https://lod.humanatlas.io/sparql') {
  const query = getCellSummariesQuery(cellWeights, organIri);
  const summaries = await select(query, endpoint);
  const sources = getSourceSimilarities(cellWeights, summaries);
  const datasets = sources
    .filter((row) => row.cell_source_type === 'http://purl.org/ccf/Dataset')
    .map((row) => row.cell_source)
    .slice(0, 10);
  const ruiLocations = sources
    .filter((row) => row.cell_source_type === 'http://purl.org/ccf/SpatialEntity')
    .map((row) => row.cell_source)
    .slice(0, 10);
  const ruiLocationQuery = getRuiLocationsQuery(datasets, ruiLocations);
  try {
    const ruiLocationsJsonLd = await construct(ruiLocationQuery, endpoint, ruiLocationsFrame);
    return { sources, rui_locations: ruiLocationsJsonLd };
  } catch (error) {
    return { sources: [], rui_locations: [], error };
  }
}
