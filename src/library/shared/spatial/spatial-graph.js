import { Euler, Matrix4, toDegrees, toRadians } from '@math.gl/core';
import { OrientedBoundingBox } from '@math.gl/culling';
import graphology from 'graphology';
import shortestPath from 'graphology-shortest-path/unweighted.js';
import { v4 as uuidV4 } from 'uuid';
import dimensionsQuery from '../../v1/queries/spatial-entity-dimensions.rq';
import hraPlacementsQuery from '../../v1/queries/spatial-placements-hra.rq';
import placementsQuery from '../../v1/queries/spatial-placements.rq';
import { ensureArray } from '../../v1/utils/jsonld-compat.js';
import { select } from '../utils/sparql.js';

/** @type {Promise<SpatialGraph> | undefined} */
let CACHED_GRAPH;

/**
 * Get an initialized spatial graph for spatial queries
 *
 * @param {string} endpoint the sparql endpoint to use for queries
 * @param {boolean} useCache whether to create/use a cached SpatialGraph
 * @returns {Promise<SpatialGraph>} a promise for an initialized SpatialGraph
 */
export async function getSpatialGraph(endpoint, useCache = true) {
  if (!useCache) {
    return new SpatialGraph(endpoint).initialize();
  } else {
    if (!CACHED_GRAPH) {
      CACHED_GRAPH = getSpatialGraph(endpoint, false);
    }
    return CACHED_GRAPH;
  }
}

function getScaleFactor(units) {
  switch (units) {
    case 'centimeter':
      return 0.01;
    default:
    case 'millimeter':
      return 0.001;
    case 'meter':
      return 1;
  }
}

export class SpatialGraph {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async initialize() {
    const graph = (this.graph = new graphology.DirectedGraph());
    const [placements, hraPlacements, dimensions] = await Promise.all([
      select(placementsQuery, this.endpoint),
      select(hraPlacementsQuery, this.endpoint),
      select(dimensionsQuery, this.endpoint),
    ]);
    for (const placement of placements.concat(hraPlacements)) {
      graph.mergeDirectedEdge(placement.source, placement.target, { placement });
    }

    const halfSizeLookup = (this.halfSizeLookup = {});
    for (const { rui_location, x, y, z, units } of dimensions) {
      const factor = getScaleFactor(units) * 0.5;
      halfSizeLookup[rui_location] = [x, y, z].map((n) => Number(n) * factor);
    }
    return this;
  }

  getTransformationMatrix(sourceIRI, targetIRI) {
    if (sourceIRI === targetIRI) {
      return new Matrix4(Matrix4.IDENTITY); // identity
    }
    if (!this.graph.hasNode(sourceIRI) || !this.graph.hasNode(targetIRI)) {
      return undefined;
    }

    const tx = new Matrix4(Matrix4.IDENTITY);
    const path = shortestPath.bidirectional(this.graph, sourceIRI, targetIRI);
    if (path && path.length > 0) {
      path.reverse();
      let target = '';
      for (const source of path) {
        if (target) {
          const placement = this.graph.getEdgeAttribute(source, target, 'placement');
          this.applySpatialPlacement(tx, placement);
        }
        target = source;
      }
      return tx;
    } else {
      return undefined;
    }
  }

  applySpatialPlacement(tx, placement) {
    const p = placement;
    const factor = getScaleFactor(p.translation_units);
    const T = [p.x_translation * factor, p.y_translation * factor, p.z_translation * factor];
    const R = [p.x_rotation, p.y_rotation, p.z_rotation].map(toRadians);
    const S = [p.x_scaling, p.y_scaling, p.z_scaling];

    return tx.translate(T).rotateXYZ(R).scale(S);
  }

  getSpatialPlacement(source, targetIri) {
    const sourceIri = this.graph.hasNode(source['@id']) ? source['@id'] : undefined;
    const placement = ensureArray(source.placement)[0];

    let matrix;
    if (placement && this.graph.hasNode(placement.target)) {
      matrix = this.getTransformationMatrix(placement.target, targetIri);
      if (matrix) {
        matrix = this.applySpatialPlacement(matrix, placement);
      }
    } else if (sourceIri) {
      matrix = this.getTransformationMatrix(sourceIri, targetIri);
    }

    if (matrix) {
      const euler = new Euler().fromRotationMatrix(matrix, Euler.XYZ);
      const T = matrix.getTranslation().map((n) => n * 1000);
      const R = euler.toVector3().map(toDegrees);
      const S = matrix.getScale().map((n) => (n < 1 && n > 0.999999 ? 1 : n));

      return {
        '@context': 'https://hubmapconsortium.github.io/hubmap-ontology/ccf-context.jsonld',
        '@id': `http://purl.org/ccf/1.5/${uuidV4()}_placement`,
        '@type': 'SpatialPlacement',
        source: source['@id'],
        target: targetIri,
        placement_date: new Date().toISOString().split('T')[0],
        x_scaling: S[0],
        y_scaling: S[1],
        z_scaling: S[2],
        scaling_units: 'ratio',
        x_rotation: R[0],
        y_rotation: R[1],
        z_rotation: R[2],
        rotation_order: 'XYZ',
        rotation_units: 'degree',
        x_translation: T[0],
        y_translation: T[1],
        z_translation: T[2],
        translation_units: 'millimeter',
      };
    } else {
      return undefined;
    }
  }

  get3DObjectTransform(_sourceIri, targetIri, objectRefIri) {
    let transform = this.getTransformationMatrix(objectRefIri, targetIri);
    if (transform) {
      transform = new Matrix4(Matrix4.IDENTITY).rotateX(toRadians(90)).multiplyLeft(transform);
    }
    return transform;
  }

  getExtractionSiteTransform(sourceIri, targetIri, bounds) {
    const transform = this.getTransformationMatrix(sourceIri, targetIri);
    if (transform) {
      // Scale visible bounding boxes to the desired dimensions
      if (bounds) {
        const factor = getScaleFactor(bounds.dimension_units) * 0.5;
        const scale = [bounds.x_dimension * factor, bounds.y_dimension * factor, bounds.z_dimension * factor];
        transform.scale(scale);
      }
    }
    return transform;
  }

  getOrientedBoundingBox(sourceIri, targetIri) {
    const matrix = this.getTransformationMatrix(sourceIri, targetIri);
    const halfSize = this.halfSizeLookup[sourceIri];
    if (matrix && halfSize) {
      const center = matrix.getTranslation();
      if (center.findIndex(isNaN) === -1) {
        const quaternion = new Euler().fromRotationMatrix(matrix, Euler.XYZ).toQuaternion().normalize().calculateW();
        return new OrientedBoundingBox().fromCenterHalfSizeQuaternion(center, halfSize, quaternion);
      }
    }
    return undefined;
  }

  probeExtractionSites(search, results = new Set()) {
    const { x, y, z, radius, target } = search;
    const radiusSquared = (radius / 1000) * (radius / 1000);
    const center = [x, y, z].map((n) => n / 1000);
    for (const sourceIri of Object.keys(this.halfSizeLookup)) {
      const boundingBox = this.getOrientedBoundingBox(sourceIri, target);
      if (boundingBox) {
        const distanceSquared = boundingBox.distanceSquaredTo(center);
        if (distanceSquared <= radiusSquared) {
          results.add(sourceIri);
        }
      }
    }
    return results;
  }
}
