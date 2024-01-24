import frame from '../frames/tree-model.jsonld';
import query from '../queries/biomarker-tree-model.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { formatTreeModel } from '../utils/format-tree-model.js';

function reformatResponse(jsonld) {
  const tree = formatTreeModel(jsonld);
  const bmTypes = ['gene', 'protein', 'metabolites', 'proteoforms', 'lipids'];
  
  // Reformat the root node
  const rootNode = tree.nodes[tree.root]
  rootNode.children = bmTypes;
  rootNode.id = 'biomarkers';
  rootNode.parent = '';
  tree.nodes['biomarkers'] = rootNode;
  delete tree.nodes[tree.root];
  tree.root = 'biomarkers';
  
  // Relink using the labels instead of iris for backwards compatibility
  for (const type of bmTypes) {
    const node = tree.nodes[type] = tree.nodes[`http://purl.org/ccf/${type}`];
    delete tree.nodes[`http://purl.org/ccf/${type}`];
    node.children.forEach((iri) => {
      tree.nodes[iri].parent = type;
    });
    node.id = type;
  }
  return tree;
}

/**
 * Retrieves the biomarker tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getBiomarkerTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
