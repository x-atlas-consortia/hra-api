import frame from '../frames/tree-model.jsonld';
import query from '../queries/cell-type-tree-model.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { formatTreeModel, treeify } from '../utils/format-tree-model.js';

function reformatResponse(jsonld) {
  const tree = formatTreeModel(jsonld);
  treeify(tree);
  const nodes = tree.nodes;
  nodes[tree.root].label = 'cell';
  nodes[tree.root].children.sort((a, b) => {
    return nodes[a].label.localeCompare(nodes[b].label);
  });
  return tree;
}

/**
 * Retrieves the cell type tree model
 * @param {Object} filter - An object containing query filters
 * @param {string} endpoint - The SPARQL endpoint to connect to
 * @returns {Promise<Object>} - A promise that resolves to reference organ data
 */
export async function getCellTypeTreeModel(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}
