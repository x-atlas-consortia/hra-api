import Papa from 'papaparse';
import query from '../queries/asctb-sheet-config-data.rq';
import { executeFilteredQuery } from '../utils/execute-sparql.js';

// Google Sheet ID that holds the DRAFT ASCT+B Table info
const DRAFTS_SHEET_ID = '1ER90abGCF84MVdIFl51KEawfuuM5YhUbLCgt2i50nHg';

function reformatResponse(publishedData, draftData) {
  const hraVersions = Array.from(new Set(publishedData.map((s) => s.hraVersion))).sort();
  const results = {
    all: {
      name: 'all',
      display: 'All by CCF-HRA release',
      title: 'Organs',
      body: 'Body',
      sheetId: '1tK916JyG5ZSXW_cXfsyZnzXfjyoN-8B2GXLbYD6_vF0',
      gid: '',
      config: {
        bimodal_distance_x: 350,
        bimodal_distance_y: 60,
        width: 700,
        height: 5000,
      },
      representation_of: [],
      version: hraVersions.map((hraVersion) => ({
        value: `All_Organs-${hraVersion}`,
        viewValue: hraVersion,
        hraVersion,
      })),
    },
    example: {
      name: 'example',
      display: 'Example',
      sheetId: '0',
      gid: '0',
      config: {
        bimodal_distance_x: 200,
        bimodal_distance_y: 50,
        width: 500,
        height: 500,
      },
      title: 'Anatomical Structures',
      data: '',
    },
    some: {
      name: 'some',
      display: 'Selected Organs',
      body: 'Body',
      sheetId: '1tK916JyG5ZSXW_cXfsyZnzXfjyoN-8B2GXLbYD6_vF0',
      gid: '',
      config: {
        bimodal_distance_x: 350,
        bimodal_distance_y: 60,
        width: 700,
        height: 5000,
      },
      representation_of: [],
      title: 'Organs',
    },
  };

  for (const { folder: name, filename: value, file_id: sheetId } of draftData) {
    const [doName, doVersion, _draft] = value?.split('_');
    results[doName] = {
      name,
      display: name.replace(/\_/g, ' '),
      config: {
        bimodal_distance_x: 250,
        bimodal_distance_y: 60,
        width: 700,
        height: 2250,
      },
      representation_of: [],
      title: 'Anatomical Structures',
      data: '',
      version: [
        {
          sheetId,
          gid: '0',
          value,
          viewValue: doVersion + ' DRAFT',
          link: `https://docs.google.com/spreadsheets/d/${sheetId}`
        },
      ],
    };
  }

  for (const { purl, name, version, hraVersion, representation_of, csvUrl } of publishedData) {
    const tableInfo = results[name];
    if (tableInfo) {
      if (!tableInfo.representation_of.includes(representation_of)) {
        tableInfo.representation_of.push(representation_of);
      }
      let versionInfo = tableInfo.version.find((ver) => ver.viewValue === version);
      if (!versionInfo) {
        versionInfo = { csvUrl, value: `${name}-${version}`, viewValue: version, hraVersion: '', link: purl };
        tableInfo.version.unshift(versionInfo);
      }
      if (!versionInfo.hraVersion) {
        versionInfo.hraVersion = hraVersion;
      } else {
        versionInfo.hraVersion += `,${hraVersion}`;
      }
    }
  }

  return Object.values(results);
}

function googleSheetCsvUrl(sheetId, gid = undefined) {
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (gid !== undefined) {
    url += `?gid=${gid}`;
  }
  return url;
}

async function fetchSheet(csvUrl) {
  const resp = await fetch(csvUrl);
  const text = await resp.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return data || [];
}

/**
 * Get ASCT+B Reporter sheet-config.json data
 * @param {Object} filter - An object containing query filters [ignored]
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to biomarker term occurrences
 */
export async function getASCTBSheetConfig(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  endpoint = 'https://lod.humanatlas.io/sparql'; // override endpoint customization for now.
  const [publishedData, draftData] = await Promise.all([
    executeFilteredQuery(query, filter, endpoint),
    fetchSheet(googleSheetCsvUrl(DRAFTS_SHEET_ID)),
  ]);
  return reformatResponse(publishedData, draftData);
}
