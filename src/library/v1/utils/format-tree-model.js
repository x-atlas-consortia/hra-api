export function formatTreeModel(data) {
  const root = data[0]?.root;
  const nodes = {};
  for (const { child, parent, label, synonymLabel } of data) {
    const node = (nodes[child] = nodes[child] || {
      '@id': child,
      '@type': 'OntologyTreeNode',
      id: child,
      parent,
      children: [],
      synonymLabels: new Set(),
      label,
    });
    if (child === parent) {
      node.parent = '';
    }
    if (synonymLabel) {
      node.synonymLabels.add(synonymLabel);
    }
  }

  for (const node of Object.values(nodes)) {
    const parent = nodes[node.parent];
    if (parent) {
      parent.children.push(node['@id']);
    }
    node.synonymLabels = Array.from(node.synonymLabels);
  }

  const tree = { root, nodes };
  treeify(tree);
  return tree;
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
