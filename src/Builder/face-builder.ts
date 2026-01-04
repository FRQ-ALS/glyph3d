import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Face, Triangle } from "../mesh/mesh.types";
import { GenericMeshParams } from "./builder.types";
import { earcut } from "../triangulation/ear-clipping";
import { bridgeHolesToBoundary } from "../triangulation/ear-clipping-holes";

export namespace Facebuilder {
  /**
   * Builds a 3D mesh by extruding a 2D polygon with holes.
   * Front/back faces use a bridged polygon.
   * Side faces are created ONLY from real boundaries (shape + holes).
   */
  export function build(geometry: GenericMeshParams): {
    vertices: Vector[];
    faces: Face[];
  } {
    const { depth, shape, holes = [] } = geometry;

    // Used ONLY for triangulation
    const mergedShape = bridgeHolesToBoundary(shape, holes);

    const normal = VectorMath.computeNormalNewells(mergedShape);
    const vertices = createExtrudedVertices(mergedShape, normal, depth);

    const indexMap = buildIndexMap(mergedShape);
    const backOffset = mergedShape.length;

    const faces: Face[] = [];

    faces.push(createFrontFace(mergedShape));
    faces.push(createBackFace(vertices, backOffset));

    // Side faces: ONLY real contours
    faces.push(...createSideFacesForLoop(shape, indexMap, backOffset));
    for (const hole of holes) {
      faces.push(...createSideFacesForLoop(hole, indexMap, backOffset));
    }

    return { vertices, faces };
  }

  /* ───────────────────────── Vertices ───────────────────────── */

  function createExtrudedVertices(shape: Vector[], normal: Vector, depth: number): Vector[] {
    const front = shape;
    const back = shape.map(
      (v) => new Vector(v.x + normal.x * depth, v.y + normal.y * depth, v.z + normal.z * depth)
    );

    return [...front, ...back];
  }

  /* ───────────────────────── Faces ───────────────────────── */

  function createFrontFace(shape: Vector[]): Face {
    return {
      face: 0,
      triangles: earcut(shape),
    };
  }

  function createBackFace(vertices: Vector[], offset: number): Face {
    const backVertices = vertices.slice(offset);

    const triangles = earcut(backVertices).map((t) => reverseAndOffsetTriangle(t, offset));

    return {
      face: 1,
      triangles,
    };
  }

  function reverseAndOffsetTriangle(triangle: Triangle, offset: number): Triangle {
    const [a, b, c] = triangle.indices;
    return {
      indices: [c + offset, b + offset, a + offset],
    };
  }

  /* ───────────────────────── Side Faces ───────────────────────── */

  function createSideFacesForLoop(
    loop: Vector[],
    indexMap: Map<string, number>,
    backOffset: number
  ): Face[] {
    const faces: Face[] = [];

    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];

      const frontA = indexMap.get(key(a));
      const frontB = indexMap.get(key(b));

      if (frontA === undefined || frontB === undefined) {
        throw new Error("Vertex not found in merged shape");
      }

      const backA = frontA + backOffset;
      const backB = frontB + backOffset;

      faces.push({
        face: faces.length + 2,
        triangles: [{ indices: [frontA, backA, backB] }, { indices: [frontA, backB, frontB] }],
      });
    }

    return faces;
  }

  /* ───────────────────────── Utilities ───────────────────────── */

  function buildIndexMap(vertices: Vector[]): Map<string, number> {
    const map = new Map<string, number>();
    vertices.forEach((v, i) => map.set(key(v), i));
    return map;
  }

  function key(v: Vector): string {
    return `${v.x}|${v.y}|${v.z}`;
  }

  /**
   * Calculates bounding box dimensions.
   */
  export function computeDimensions(vertices: Vector[]) {
    const bounds = vertices.reduce(
      (acc, v) => ({
        minX: Math.min(acc.minX, v.x),
        minY: Math.min(acc.minY, v.y),
        minZ: Math.min(acc.minZ, v.z),
        maxX: Math.max(acc.maxX, v.x),
        maxY: Math.max(acc.maxY, v.y),
        maxZ: Math.max(acc.maxZ, v.z),
      }),
      {
        minX: Infinity,
        minY: Infinity,
        minZ: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        maxZ: -Infinity,
      }
    );

    return {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      depth: bounds.maxZ - bounds.minZ,
    };
  }
}
