import { ensureArray, ensureNumber, expandIris } from './jsonld-compat.js';

export function reformatSceneNodes(nodes, graph, targetIri) {
  const refOrgans = [];
  const skinRefOrgans = [];
  const extractionSites = [];

  nodes.sort((a, b) => a.rui_rank - b.rui_rank);

  for (let n of nodes) {
    n = expandIris(n);
    if (n.entityId) {
      // Reformat and apply defaults to experimental data
      const bounds = {
        dimension_units: n.dimension_units,
        x_dimension: ensureNumber(n.x_dimension),
        y_dimension: ensureNumber(n.y_dimension),
        z_dimension: ensureNumber(n.z_dimension),
      };
      const transformMatrix = graph.getExtractionSiteTransform(n.rui_location, targetIri, bounds);
      Object.assign(n, {
        '@id': n.rui_location,
        ccf_annotations: ensureArray(n.ccf_annotations),
        transformMatrix,
        color: [255, 255, 255, 0.9 * 255],
        // Delete temporary properties
        rui_location: undefined,
        x_dimension: undefined,
        y_dimension: undefined,
        z_dimension: undefined,
        dimension_units: undefined,
      });

      extractionSites.push(n);
    } else {
      // Apply defaults to reference organs
      const transformMatrix = graph.get3DObjectTransform(n['@id'], targetIri, n.object);
      const isSkin = n.representation_of === 'http://purl.obolibrary.org/obo/UBERON_0002097';
      Object.assign(n, {
        sex: n.organ_owner_sex,
        scenegraph: n.file,
        scenegraphNode: n.file_subpath,
        transformMatrix,
        color: [255, 255, 255, 255],
        opacity: isSkin ? 0.5 : 0.2,
        unpickable: true,
        _lighting: 'pbr',
        zoomBasedOpacity: false,
        // Delete temporary properties
        object: undefined,
        organ_owner_sex: undefined,
        file: undefined,
        file_subpath: undefined,
        rui_rank: undefined,
      });

      if (isSkin) {
        skinRefOrgans.push(n);
      } else {
        refOrgans.push(n);
      }
    }
  }

  return [...skinRefOrgans, ...refOrgans, ...extractionSites];
}