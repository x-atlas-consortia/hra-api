import frame from '../frames/tissue-blocks.jsonld';
import query from '../queries/tissue-blocks.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureGraphArray, normalizeJsonLd, renameField } from '../utils/jsonld-compat.js';

const ARRAY_FIELDS = new Set(['datasets', 'sections']);
const SINGLE_VALUE_FIELDS = new Set([
  // Common fields for all tissue data objects (e.g., blocks, datasets, and sections)
  'label',
  'description',
  'link',
  // Tissue block-specific fields
  'donor',
  'rui_location',
  'section_size',
  // Donor-specific fields
  'provider_name',
  // Dataset-specific fields
  'technology',
  'thumbnail',
]);
const TISSUE_BLOCK_FIELDS = [
  '@id',
  '@type',
  'link',
  'label',
  'description',
  'section_count',
  'section_size',
  'section_units',
  'datasets',
];

function normalizeDonor(donor) {
  renameField(donor, 'provider_name', 'providerName');
  return donor;
}

function normalizeSections(sections) {
  sections = sections.filter((section) => typeof section === 'object');
  sections.forEach((section) => {
    section.sampleType = 'Tissue Section';
    delete section.sample_type;
    renameField(section, 'section_number', 'sectionNumber');
  });
  return sections;
}

function normalizeSpatialEntityId(spatialEntityId) {
  if (typeof spatialEntityId === 'object') {
    return spatialEntityId['@id'];
  }
  return spatialEntityId;
}

function normalizeBlock(block) {
  const normalizedBlock = {};
  TISSUE_BLOCK_FIELDS.forEach((field) => (normalizedBlock[field] = block[field]));
  normalizedBlock['sampleType'] = 'Tissue Block';
  normalizedBlock['donor'] = normalizeDonor(block['donor']);
  normalizedBlock['sections'] = normalizeSections(block['sections']);
  normalizedBlock['spatialEntityId'] = normalizeSpatialEntityId(block['rui_location']);
  renameField(normalizedBlock, 'section_count', 'sectionCount');
  renameField(normalizedBlock, 'section_size', 'sectionSize');
  renameField(normalizedBlock, 'section_units', 'sectionUnits');
  return normalizedBlock;
}

function reformatResponse(jsonld) {
  const data = normalizeJsonLd(ensureGraphArray(jsonld), ARRAY_FIELDS, undefined, SINGLE_VALUE_FIELDS);
  return data.filter((block) => block['donor']).map(normalizeBlock);
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
