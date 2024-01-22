import frame from '../frames/tissue-blocks.jsonld';
import query from '../queries/tissue-blocks.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureArray, ensureGraphArray, ensureNumber, expandIris } from '../utils/jsonld-compat.js';

function reformatResponse(results) {
  const resultArray = ensureGraphArray(results)
    .map((block) => {
      // return block;
      const {
        donor,
        datasets,
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
        if (donor['ccf:bmi']) {
          donor.bmi = ensureNumber(donor['ccf:bmi']);
          delete donor['ccf:bmi'];
        }
        donor.label = Array.isArray(donor.label) ? donor.label.join('; ') : donor.label || '';
      } else {
        return undefined;
      }
      const sections = ensureArray(block.sections);
      sections.forEach((section) => {
        section.sample_type = 'Tissue Section';
        section.datasets = ensureArray(section.datasets);
      });

      return {
        '@id': block['@id'],
        '@type': block['@type'],
        sample_type: 'Tissue Block',
        link,
        label,
        description: Array.isArray(description) ? description.join('; ') : description || '',
        sectionCount,
        sectionSize,
        sectionUnits,
        donor,
        datasets: datasets ?? [],
        sections: sections ?? [],
        spatialEntityId
      };
    })
    .filter((s) => !!s);
  return expandIris(resultArray);
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
