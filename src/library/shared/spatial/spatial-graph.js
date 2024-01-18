import { Euler, Matrix4, toDegrees, toRadians } from '@math.gl/core';
import graphology from 'graphology';
import shortestPath from 'graphology-shortest-path/unweighted.js';
import { v4 as uuidV4 } from 'uuid';
import query from '../../v1/queries/spatial-placements.rq';
import { ensureArray } from '../../v1/utils/jsonld-compat.js';
import { select } from '../utils/sparql.js';

let CACHED_GRAPH;

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

export class SpatialGraph {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async initialize() {
    const graph = (this.graph = new graphology.DirectedGraph());
    const placements = await select(query, this.endpoint);
    for (const placement of placements) {
      graph.mergeDirectedEdge(placement.source, placement.target, { placement });
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
    let factor;
    switch (p.translation_units) {
      case 'centimeter':
        factor = 1 / 100;
        break;
      case 'millimeter':
        factor = 1 / 1000;
        break;
      case 'meter':
      default:
        factor = 1;
        break;
    }
    const T = [p.x_translation, p.y_translation, p.z_translation].map((t) => t * factor);
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
    let transform = this.getTransformationMatrix(sourceIri, targetIri);
    if (transform) {
      transform = new Matrix4(Matrix4.IDENTITY).rotateX(toRadians(90)).multiplyLeft(transform);
      // Scale visible bounding boxes to the desired dimensions
      if (bounds) {
        let factor;
        switch (bounds.dimension_units) {
          case 'centimeter':
            factor = 1 / 100;
            break;
          case 'millimeter':
            factor = 1 / 1000;
            break;
          case 'meter':
          default:
            factor = 1;
            break;
        }
        const scale = [bounds.x_dimension, bounds.y_dimension, bounds.z_dimension].map((dim) => (dim * factor) / 2);
        transform.scale(scale);
      }
    }
    return transform;
  }
}
