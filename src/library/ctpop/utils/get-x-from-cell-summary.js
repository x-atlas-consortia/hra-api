import { getCellDistributionSimilarity } from './cell-summary-similarity.js';
import { getRuiLocationsQuery } from './rui-locations-query.js';
import { construct, select } from '../../shared/utils/sparql.js';
import ruiLocationsFrame from '../../v1/frames/rui-locations.jsonld';
import cellSummariesQuery from '../queries/select-cell-summaries.rq'

function getCellSummariesQuery(cellWeights) {
  const values = Object.keys(cellWeights).reduce((vals, iri) => vals + ` (<${iri}>)`, '');
  const valString = `VALUES (?cell_id) { ${values} }`
  return cellSummariesQuery.replaceAll('#{{VALUES}}', valString);
}

function getSourceSimilarities(cellWeights, summaries) {
  const sources = summaries.reduce((lookup, row) => {
    const id = `${row.cell_source}$${row.modality}`;
    if (!lookup[id]) {
      lookup[id] = {
        cell_source: row.cell_source,
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

export async function getSimilarCellSources(cellWeights, endpoint = 'https://lod.humanatlas.io/sparql') {
  const query = getCellSummariesQuery(cellWeights);
  const summaries = await select(query, endpoint);
  const sources = getSourceSimilarities(cellWeights, summaries);
  const datasets = sources
    .filter((row) =>
      row.cell_source.startsWith(
        'https://cns-iu.github.io/hra-cell-type-populations-supporting-information/data/datasets.jsonld#'
      )
    )
    .map((row) => row.cell_source)
    .slice(0, 10);
  const ruiLocations = sources
    .filter((row) => row.cell_source.startsWith('http://purl.org/ccf/1.5/'))
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
