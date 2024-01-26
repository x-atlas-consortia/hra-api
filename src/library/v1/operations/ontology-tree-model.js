import frame from '../frames/tree-model.jsonld';
import query from '../queries/ontology-tree-model.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { formatTreeModel, treeify } from '../utils/format-tree-model.js';

function reformatResponse(jsonld) {
  const tree = formatTreeModel(jsonld);
  treeify(tree);
  const body = tree.nodes[tree.root]
  body.label = 'body';
  body.children = [
    'http://purl.obolibrary.org/obo/UBERON_0000955', // Brain
    'http://purl.obolibrary.org/obo/UBERON_0000029', // Lymph Node
    // 'http://purl.obolibrary.org/obo/UBERON_0002509', // Mesenteric Lymph Node
    'http://purl.obolibrary.org/obo/UBERON_0000970', // Eye
    // 'http://purl.obolibrary.org/obo/UBERON_0004548', // Eye, L
    // 'http://purl.obolibrary.org/obo/UBERON_0004549', // Eye, R
    'http://purl.obolibrary.org/obo/UBERON_0003889', // Fallopian Tube
    // 'http://purl.obolibrary.org/obo/UBERON_0001303', // Fallopian Tube, L
    // 'http://purl.obolibrary.org/obo/UBERON_0001302', // Fallopian Tube, R
    'http://purl.obolibrary.org/obo/UBERON_0000948', // Heart
    'http://purl.obolibrary.org/obo/UBERON_0002113', // Kidney
    // 'http://purl.obolibrary.org/obo/UBERON_0004538', // Kidney, L
    // 'http://purl.obolibrary.org/obo/UBERON_0004539', // Kidney, R
    'http://purl.obolibrary.org/obo/UBERON_0001465', // Knee
    // 'http://purl.org/sig/ont/fma/fma24978', // Knee, L
    // 'http://purl.org/sig/ont/fma/fma24977', // Knee, R
    'http://purl.obolibrary.org/obo/UBERON_0001737', // Larynx
    'http://purl.obolibrary.org/obo/UBERON_0002107', // Liver
    'http://purl.obolibrary.org/obo/UBERON_0002048', // Lungs
    'http://purl.obolibrary.org/obo/UBERON_0002182', // Main Bronchus
    'http://purl.obolibrary.org/obo/UBERON_0001911', // Mammary Gland
    // 'http://purl.org/sig/ont/fma/fma57991', // Mammary Gland, L
    // 'http://purl.org/sig/ont/fma/fma57987', // Mammary Gland, R
    'http://purl.obolibrary.org/obo/UBERON_0000992', // Ovary
    // 'http://purl.org/sig/ont/fma/fma7214', // Ovary, L
    // 'http://purl.org/sig/ont/fma/fma7213', // Ovary, R
    'http://purl.obolibrary.org/obo/UBERON_0002373', // Palatine Tonsil
    // 'http://purl.org/sig/ont/fma/fma54974', // Palatine Tonsil, L
    // 'http://purl.org/sig/ont/fma/fma54973', // Palatine Tonsil, R
    'http://purl.obolibrary.org/obo/UBERON_0001264', // Pancreas
    'http://purl.obolibrary.org/obo/UBERON_0001270', // Pelvis
    'http://purl.obolibrary.org/obo/UBERON_0001987', // Placenta
    'http://purl.obolibrary.org/obo/UBERON_0002367', // Prostate
    'http://purl.obolibrary.org/obo/UBERON_0002097', // Skin
    'http://purl.obolibrary.org/obo/UBERON_0002108', // Small Intestine
    'http://purl.obolibrary.org/obo/UBERON_0002240', // Spinal Cord
    'http://purl.obolibrary.org/obo/UBERON_0000059', // Large Intestine
    'http://purl.obolibrary.org/obo/UBERON_0002106', // Spleen
    'http://purl.obolibrary.org/obo/UBERON_0002370', // Thymus
    'http://purl.obolibrary.org/obo/UBERON_0003126', // Trachea
    'http://purl.obolibrary.org/obo/UBERON_0000056', // Ureter
    // 'http://purl.obolibrary.org/obo/UBERON_0001223', // Ureter, L
    // 'http://purl.obolibrary.org/obo/UBERON_0001222', // Ureter, R
    'http://purl.obolibrary.org/obo/UBERON_0001255', // Urinary Bladder
    'http://purl.obolibrary.org/obo/UBERON_0000995', // Uterus
    'http://purl.obolibrary.org/obo/UBERON_0004537', // Blood Vasculature
    // 'http://purl.obolibrary.org/obo/UBERON_0000467', // Anatomical System
  ].filter((iri) => iri in tree.nodes);
  for (const child of body.children) {
    tree.nodes[child].parent = body['@id'];
  }
  return tree;
}

/**
 * Retrieves the ontology tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getOntologyTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
