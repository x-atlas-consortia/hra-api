// Converted from transpiled ccf-ui code:
// https://github.com/hubmapconsortium/ccf-ui/blob/main/projects/ccf-body-ui/src/lib/util/simplify-scene.ts

import { Matrix4 } from '@math.gl/core';
import { AABB, Vec3 } from 'cannon-es';
import { loadGLTF } from './load-gltf.js';
import { traverseScene } from './scene-traversal.js';

export async function simplifyScene(nodes) {
  const gltfCache = {};
  const gltfUrls = new Set(nodes.map((n) => n.scenegraph).filter((n) => !!n));
  for (const gltfUrl of gltfUrls) {
    gltfCache[gltfUrl] = await loadGLTF({ scenegraph: gltfUrl });
  }
  const newNodes = nodes.filter((n) => !n.scenegraph);
  for (const model of nodes.filter((n) => n.scenegraph)) {
    const gltf = gltfCache[model.scenegraph];
    const bbox = new AABB();
    let worldMatrix = new Matrix4(model.transformMatrix);
    if (model.scenegraphNode) {
      const scenegraphNode = model.scenegraphNode ? gltf.nodes.find((n) => n.name === model.scenegraphNode) : undefined;
      let foundNodeInScene = false;
      for (const scene of gltf.scenes) {
        if (!foundNodeInScene) {
          traverseScene(scene, new Matrix4(model.transformMatrix), (child, modelMatrix) => {
            if (child === scenegraphNode) {
              worldMatrix = modelMatrix;
              foundNodeInScene = true;
              return false;
            }
            return true;
          });
        }
      }
      gltf.scene = {
        id: model.scenegraphNode,
        name: model.scenegraphNode,
        nodes: [scenegraphNode],
      };
    }
    traverseScene(gltf.scene, worldMatrix, (node, modelMatrix) => {
      if (node.mesh && node.mesh.primitives && node.mesh.primitives.length > 0) {
        for (const primitive of node.mesh.primitives) {
          if (primitive.attributes.POSITION && primitive.attributes.POSITION.min) {
            const lowerBound = modelMatrix.transformAsPoint(primitive.attributes.POSITION.min, []);
            const upperBound = modelMatrix.transformAsPoint(primitive.attributes.POSITION.max, []);
            const innerBbox = new AABB({
              lowerBound: new Vec3(...lowerBound.map((n, i) => Math.min(n, upperBound[i]))),
              upperBound: new Vec3(...upperBound.map((n, i) => Math.max(n, lowerBound[i]))),
            });
            bbox.extend(innerBbox);
          }
        }
      }
      return true;
    });
    const size = bbox.upperBound.clone().vsub(bbox.lowerBound);
    const halfSize = size.clone().vmul(new Vec3(0.5, 0.5, 0.5));
    const position = bbox.lowerBound.clone().vadd(halfSize);
    const transformMatrix = new Matrix4(Matrix4.IDENTITY).translate(position.toArray()).scale(halfSize.toArray());
    const newNode = {
      ...model,
      transformMatrix,
      geometry: 'wireframe',
    };
    delete newNode.scenegraph;
    delete newNode.scenegraphNode;
    newNodes.push(newNode);
  }
  return newNodes;
}
