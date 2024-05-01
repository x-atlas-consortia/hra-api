import { Matrix4 } from '@math.gl/core';
import { getSpatialGraph } from '../../shared/spatial/spatial-graph.js';
import { select } from '../../shared/utils/sparql.js';
import landmarksQuery from '../../v1/queries/reference-landmarks.rq';
import hraPlacementsQuery from '../../v1/queries/reference-organ-placement-patches.rq';
import landmarksFrame from '../frames/reference-landmarks.jsonld';
import frame from '../frames/reference-organs.jsonld';
import query from '../queries/reference-organ-as.rq';
import { executeFilteredConstructQuery } from '../utils/execute-sparql.js';
import { ensureArray, ensureGraphArray, normalizeJsonLd } from '../utils/jsonld-compat.js';
import { getReferenceOrgans } from './reference-organs.js';
import { simplifyScene } from '../../shared/spatial/simplify-scene.js';

function reformatResponse(results) {
  return normalizeJsonLd(ensureGraphArray(results));
}

function getLabel(spatialEntity) {
  return spatialEntity.label
    .replace('Spatial entity of female ', '')
    .replace('Spatial entity of male ', '')
    .replace('left ', '')
    .replace('right ', '')
    .replace('Left ', '')
    .replace('Right ', '');
}

async function getSpatialPlacements(endpoint = 'https://lod.humanatlas.io/sparql') {
  const placements = await select(hraPlacementsQuery, endpoint);
  return getPatchPlacements(undefined, placements);
}

// TODO: currently selects too many patches
function getPatchPlacements(refOrganIris, placements) {
  const placementPatches = {};
  for (const placement of placements) {
    const source = placement.source;
    // Ignore placements from spatial object references and the VH Male/Female entities
    if (
      !source.endsWith('_obj') &&
      !source.endsWith('Obj') &&
      !source.endsWith('#VHFemale') &&
      !source.endsWith('#VHMale')
    ) {
      placementPatches[source] = {
        '@id': placement.id,
        '@type': 'SpatialPlacement',
        ...placement,
        scaling_units: 'ratio',
        rotation_units: 'degree',
        id: undefined,
      };
    }
  }
  return placementPatches;
}

async function getReferenceOrganAnatomicalStructures(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(query, filter, frame, endpoint));
}

async function getReferenceLandmarks(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await executeFilteredConstructQuery(landmarksQuery, filter, landmarksFrame, endpoint)).map(
    (landmarkSet) => {
      landmarkSet.extraction_set_for = landmarkSet['ccf:extraction_set_for'];
      landmarkSet.extractionSites = ensureArray(landmarkSet.extractionSites);
      delete landmarkSet['ccf:extraction_set_for'];
      return landmarkSet;
    }
  );
}

export async function getRuiReferenceData(filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  const [refOrgans, refOrganAs, landmarkSets, graph, placementPatches] = await Promise.all([
    getReferenceOrgans(filter, endpoint),
    getReferenceOrganAnatomicalStructures(filter, endpoint),
    getReferenceLandmarks(filter, endpoint),
    getSpatialGraph(endpoint),
    getSpatialPlacements(endpoint),
  ]);

  const organIRILookup = {};
  const organSpatialEntities = {};
  for (const organ of refOrgans) {
    const key = [getLabel(organ), organ.sex, organ.side ?? ''].join('|');
    organIRILookup[key] = organ['@id'];
    organSpatialEntities[organ['@id']] = organ;
  }

  const anatomicalStructures = {};
  for (const organAs of refOrganAs) {
    const organ = organAs.reference_organ;
    const structures = (anatomicalStructures[organ] = anatomicalStructures[organ] ?? []);
    structures.push(organAs);
  }

  const sceneNodeLookup = {};
  const asNodes = [
    ...refOrganAs.map((organAs) => [organAs.reference_organ, organAs]),
    ...landmarkSets.reduce(
      (acc, landmarkSet) =>
        acc.concat(landmarkSet.extractionSites.map((site) => [landmarkSet.extraction_set_for, site])),
      []
    ),
  ];
  for (const [organ, organAs] of asNodes) {
    const organSpatialEntity = organSpatialEntities[organ];
    const body = 'https://purl.humanatlas.io/graph/hra-ccf-body#VH' + organSpatialEntity.sex;
    const organPlacement = graph.getSpatialPlacement(
      {
        '@id': organ,
        placement: organSpatialEntity.placement,
      },
      body
    );
    const dimensions = [
      organSpatialEntity.x_dimension,
      organSpatialEntity.y_dimension,
      organSpatialEntity.z_dimension,
    ].map((n) => -n / 1000 / 2);
    const tx = [organPlacement.x_translation, organPlacement.y_translation, organPlacement.z_translation].map(
      (n) => -n / 1000
    );

    let transformMatrix = graph.get3DObjectTransform(organAs['@id'], body, organAs.object['@id']);
    if (transformMatrix) {
      transformMatrix = new Matrix4(Matrix4.IDENTITY)
        .translate(dimensions)
        .translate(tx)
        .multiplyRight(transformMatrix);
    }

    const sceneNode = {
      '@id': organAs['@id'],
      '@type': 'SpatialSceneNode',
      representation_of: organAs.representation_of,
      reference_organ: organ,
      scenegraph: organAs.object.file,
      scenegraphNode: organAs.object.file_subpath,
      transformMatrix,
      tooltip: getLabel(organAs),
      unpickable: true,
      _lighting: 'pbr',
      zoomBasedOpacity: false,
      color: [255, 255, 255, 255],
    };

    sceneNodeLookup[organAs['@id']] = sceneNode;
  }

  const extractionSets = {};
  for (const refOrgan of refOrgans) {
    extractionSets[refOrgan['@id']] = extractionSets[refOrgan['@id']] || [];
  }
  // TODO: combine 'Landmarks' sets
  for (const landmarkSet of landmarkSets) {
    const refOrgan = landmarkSet.extraction_set_for;
    const sets = (extractionSets[refOrgan] = extractionSets[refOrgan] || []);
    sets.push(landmarkSet);
  }

  // TODO: get simplified scene nodes into the KG so we don't have to load/compute this on the fly
  const simpleSceneNodes = await simplifyScene(Object.values(sceneNodeLookup));
  const simpleSceneNodeLookup = simpleSceneNodes.reduce((acc, node) => {
    acc[node['@id']] = node; return acc;
  }, {});

  return {
    organIRILookup,
    organSpatialEntities,
    anatomicalStructures,
    extractionSets,
    sceneNodeLookup,
    simpleSceneNodeLookup,
    placementPatches,
  };
}
