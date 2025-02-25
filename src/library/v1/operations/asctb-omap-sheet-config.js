import Papa from 'papaparse';
import query from '../queries/asctb-omap-sheet-config-data.rq';
import { executeFilteredQuery } from '../utils/execute-sparql.js';

// Sheet with AS, CT, and BP counts (currently not encoded in OMAPs) for OMAPs
const OMAP_COUNT_LOOKUP = 'https://humanatlas.io/assets/table-data/omaps_release8.csv';

function reformatResponse(publishedData, countLookupData) {
  const results = {};
  const countLookup = Object.fromEntries(countLookupData.map((row) => [row.omapId, row]));

  for (const {
    purl,
    name,
    organName,
    version,
    hraVersion,
    representation_of,
    csvUrl,
    tissuePreservationMethod,
    imagingMethod,
  } of publishedData) {
    let tableInfo = results[name];
    if (!tableInfo) {
      tableInfo = results[name] = {
        omapId: `OMAP-${name.split('-')[0]}`,
        name: toTitleCase(organName),
        display: toTitleCase(organName),
        tissuePreservationMethod,
        imagingMethod,
        config: {
          bimodal_distance_x: 250,
          bimodal_distance_y: 60,
          width: 700,
          height: 2250,
        },
        uberon_id: representation_of,
        version: [],
      };
    }

    let versionInfo = tableInfo.version.find((ver) => ver.viewValue === version);
    if (!versionInfo) {
      const counts = countLookup[tableInfo.omapId] || { as: 0, ct: 0, bp: 0 };
      versionInfo = {
        viewValue: version,
        hraVersion: '',
        value: `${name}-${version}`,
        csvUrl,
        xlsx: csvUrl.replace(/\.csv$/, '.xlsx'),
        as: counts.as,
        ct: counts.ct,
        bp: counts.bp,
        sheetId: '',
        gid: '',
        url: purl,
      };
      tableInfo.version.unshift(versionInfo);
    }
    if (!versionInfo.hraVersion) {
      versionInfo.hraVersion = hraVersion;
    } else {
      versionInfo.hraVersion += `,${hraVersion}`;
    }
  }

  return Object.values(results);
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

async function fetchSheet(csvUrl) {
  const resp = await fetch(csvUrl);
  const text = await resp.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return data || [];
}

/**
 * Get ASCT+B Reporter omap-sheet-config.json data
 * @param {Object} filter - An object containing query filters [ignored]
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to biomarker term occurrences
 */
export async function getASCTBOmapSheetConfig(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const [publishedData, countLookupData] = await Promise.all([
    executeFilteredQuery(query, filter, endpoint),
    fetchSheet(OMAP_COUNT_LOOKUP),
  ]);
  return reformatResponse(publishedData, countLookupData);
}
