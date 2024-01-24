import frame from '../frames/tissue-blocks.jsonld';
import query from '../queries/tissue-blocks.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureArray, ensureGraphArray, normalizeJsonLd } from '../utils/jsonld-compat.js';

function reformatResponse(jsonld) {
  const resultArray = normalizeJsonLd(ensureGraphArray(jsonld), new Set(['datasets', 'sections']))
    .map((block) => {
      const {
        donor,
        datasets,
        sections,
        link,
        label,
        description,
        section_count: sectionCount,
        section_size: sectionSize,
        section_units: sectionUnits,
        rui_location: spatialEntityId,
      } = block;
      if (donor) {
        donor.providerName = donor.provider_name;
        delete donor.provider_name;
        donor.label = ensureArray(donor.label).join('; ');
      } else {
        return undefined;
      }
      sections.forEach((section) => {
        if (typeof section !== 'string') {
          section.sample_type = 'Tissue Section';
        }
      });

      return {
        '@id': block['@id'],
        '@type': block['@type'],
        sample_type: 'Tissue Block',
        link,
        label,
        description: ensureArray(description).join('; '),
        sectionCount,
        sectionSize,
        sectionUnits,
        donor,
        datasets,
        sections,
        spatialEntityId,
      };
    })
    .filter((s) => !!s);
  return resultArray;
}

/**
 * Retrieves tissue blocks
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to tissue block data
 */
export async function getTissueBlocks(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
