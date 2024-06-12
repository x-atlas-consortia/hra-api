import { convertToJsonLd } from 'hra-rui-locations-processor/src/core/main.js';
import { normalizeRegistration } from 'hra-rui-locations-processor/src/core/normalizer.js';
import { fetchAllRows } from './utils/atlas-d2k-fetch.js';

const ENDPOINT = 'https://www.atlas-d2k.org';
const EXTRACTION_SITES = `${ENDPOINT}/ermrest/catalog/2/attribute/Gene_Expression:HRA_3D_Coordinate/RID,File_URL`;
const ENTITIES = `${ENDPOINT}/ermrest/catalog/2/entity/Gene_Expression:Specimen/!(HRA_3D_Coordinate::null::)`;
const ENTITY_LINK = `${ENDPOINT}/chaise/record/#2/Gene_Expression:Specimen/RID=`;
const ENTITY_ID_PREFIX = `${ENDPOINT}/id/`;

const EXTRACTION_SITE_FILE_PATH = 'File_URL';
const ENTITY_EXTRACTION_SITE_RID = 'HRA_3D_Coordinate';
const CONSORTIUM = 'Consortium';
const CONSORTIUM_LOOKUP = {
  GUDMAP: 'd7ea2910-7857-4f98-841b-895e7cd71897',
};

async function reformatResponse(entries) {
  const registrations = entries.map((entry) => {
    const ageStr = entry.Stage_Detail?.split(' ')[0] ?? undefined;
    return {
      consortium_name: entry[CONSORTIUM],
      provider_name: entry[CONSORTIUM],
      provider_uuid: CONSORTIUM_LOOKUP[entry[CONSORTIUM]] ?? entry[CONSORTIUM],
      defaults: {
        id: ENTITY_ID_PREFIX,
        link: ENDPOINT,
      },
      donors: [
        {
          id: `${ENTITY_ID_PREFIX}${entry.RID}#Donor`,
          sex: entry.Sex,
          age: ageStr ? Number(ageStr) : undefined,
          link: `${ENTITY_LINK}${entry.RID}`,
          samples: [
            {
              id: `${ENTITY_ID_PREFIX}${entry.RID}`,
              rui_location: entry.rui_location,
            },
          ],
        },
      ],
    };
  });
  return convertToJsonLd(await normalizeRegistration(registrations), '', '');
}

export async function atlasD2kRegistrations() {
  // Query for all extraction site information
  const rows = await fetchAllRows(EXTRACTION_SITES, 500);
  const coordLookup = {};
  for (const row of rows) {
    const registryFileURL = row[EXTRACTION_SITE_FILE_PATH];
    if (registryFileURL) {
      // Fetch HRA extraction site
      const response = await fetch(`${ENDPOINT}${registryFileURL}`);
      if (response.status === 200) {
        coordLookup[row.RID] = await response.json();
      }
    }
  }

  // Query for all entries that have an extraction site
  const entries = await fetchAllRows(ENTITIES, 500);
  for (const entry of entries) {
    if (entry[ENTITY_EXTRACTION_SITE_RID]) {
      entry.rui_location = coordLookup[entry[ENTITY_EXTRACTION_SITE_RID]] ?? undefined;
    }
  }

  // Reformat the response to standard rui_locations.jsonld format
  return await reformatResponse(entries);
}

const results = await atlasD2kRegistrations();
console.log(JSON.stringify(results, null, 2));
