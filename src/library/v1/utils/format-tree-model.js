import { ensureGraphArray, ensureString, normalizeJsonLd } from './jsonld-compat.js';

export function formatTreeModel(jsonld) {
  const data = normalizeJsonLd(ensureGraphArray(jsonld));
  let root;
  const nodes = {};
  for (const node of data) {
    const id = (node['@id'] = node['@id']);
    const parent = node.parent;
    if (parent && typeof parent !== 'string') {
      node.parent = parent['@id'];
      if (!root && parent.is_root_for) {
        root = node.parent;
      }
    }
    let synonyms = [];
    if (node.synonymLabels) {
      if (Array.isArray(node.synonymLabels)) {
        synonyms = node.synonymLabels;
      } else {
        synonyms = [node.synonymLabels];
      }
    }
    node.synonymLabels = synonyms;
    if (Array.isArray(node.label)) {
      const label = node.label[0];
      synonyms = synonyms.concat(node.label.slice(1));
      node.label = label;
    }
    node.label = ensureString(node.label)?.replace(' (from CL)', '');
    node.children = [];
    nodes[id] = node;
  }
  for (const node of Object.values(nodes)) {
    const parent = nodes[node.parent];
    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node['@id']);
    }
    node.id = node['@id'];
  }
  return { root, nodes };
}

/**
 * Recursive function to ensure that the given ontology tree model is actually a tree by essentially using a BFS search.
 *
 * @param model the ontology tree model to mutate
 * @param nodeIri the tree node iri to modify. Starts at root in the base case
 * @param seen a set of IRIs that have been 'seen' so far to remove loops in the graph
 */
export function treeify(model, nodeIri = undefined, seen = new Set()) {
  const node = model.nodes[nodeIri ?? model.root];
  if (node) {
    node.children = node.children.filter((n) => !seen.has(n));
    node.children.forEach((n) => seen.add(n));
    for (const childId of node.children) {
      treeify(model, childId, seen);
      if (model.nodes[childId]) {
        model.nodes[childId].parent = node['@id'];
      }
    }
  }
}
