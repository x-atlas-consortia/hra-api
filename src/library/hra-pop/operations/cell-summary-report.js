import Papa from 'papaparse';
import { getSimilarCellSources } from '../utils/get-x-from-cell-summary';

export async function getSimilarCellSourcesReport(csvString, organIri, tool, endpoint = 'https://lod.humanatlas.io/sparql') {
  const data = Papa.parse(csvString, { header: true, skipEmptyLines: true }).data;
  if (data?.length > 0) {
    // Compute cell weights from input csv
    const cellWeights = {};
    for (const row of data) {
      const id = row['cell_id'];
      const weight = parseFloat(row['percentage']);
      if (id && !isNaN(weight) && weight > 0 && weight <= 1) {
        const cellId = id.replace('CL:', 'http://purl.obolibrary.org/obo/CL_');
        cellWeights[cellId] = weight;
      }
    }

    if (Object.keys(cellWeights).length > 0) {
      const { sources, rui_locations, error } = await getSimilarCellSources(cellWeights, organIri, tool, endpoint);
      return { sources, rui_locations, error };
    } else {
      return { sources: [], rui_locations: [] };
    }
  }
}
