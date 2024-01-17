import { ensureArray, expandIris } from './jsonld-compat.js';

export function reformatSceneNodes(nodes) {
  return nodes.map((n) => {
    if (n.entityId) {
      // Reformat and apply defaults to experimental data
      Object.assign(n, {
        '@id': n.rui_location,
        ccf_annotations: ensureArray(n.ccf_annotations),
        transformMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        color: [255, 255, 255, 0.9 * 255],
      });
      delete n.rui_location;
    } else {
      // Apply defaults to reference organs
      const isSkin = n.representation_of === 'http://purl.obolibrary.org/obo/UBERON_0002097';
      Object.assign(n, {
        transformMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        color: [255, 255, 255, 255],
        opacity: isSkin ? 0.5 : 0.2,
        unpickable: true,
        _lighting: 'pbr',
        zoomBasedOpacity: false,
      });
    }

    return expandIris(n);
  });
}
