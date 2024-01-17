import { ensureString, expandIri } from './jsonld-compat.js';

export function formatTreeModel(dataJsonLd) {
  let root;
  const nodes = {}
  for (const node of dataJsonLd['@graph']) {
    const id = node['@id'] = expandIri(node['@id']);
    const parent = node.parent;
    if (parent && typeof parent !== 'string') {
      node.parent = expandIri(parent['@id']);
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
  };
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
