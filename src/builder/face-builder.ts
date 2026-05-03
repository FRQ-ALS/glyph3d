import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Face, Triangle } from "../mesh/mesh.types";
import { GenericMeshParams } from "./builder.types";
import earcut from "earcut";

export namespace Facebuilder {
  /**
   * Builds a 3D mesh by extruding a 2D polygon with holes.
   * Front/back faces are triangulated by earcut directly from the
   * shape + holes; no bridging is needed. Side faces are created from
   * the real boundaries (shape + holes).
   */
  export function build(geometry: GenericMeshParams): {
    vertices: Vector[];
    faces: Face[];
  } {
    const { depth, shape, holes = [] } = geometry;

    const front: Vector[] = [...shape];
    const holeIndices: number[] = [];
    for (const hole of holes) {
      holeIndices.push(front.length);
      front.push(...hole);
    }

    const normal = VectorMath.computeNormalNewells(shape);
    const vertices = createExtrudedVertices(front, normal, depth);
    const backOffset = front.length;

    const faces: Face[] = [];

    faces.push(createFrontFace(front, holeIndices));
    faces.push(createBackFace(front, holeIndices, backOffset));

    faces.push(...createSideFacesForLoop(shape, 0, backOffset, faces.length));
    let loopOffset = shape.length;
    for (const hole of holes) {
      faces.push(...createSideFacesForLoop(hole, loopOffset, backOffset, faces.length));
      loopOffset += hole.length;
    }

    return { vertices, faces };
  }

  /* ───────────────────────── Vertices ───────────────────────── */

  function createExtrudedVertices(shape: Vector[], normal: Vector, depth: number): Vector[] {
    const back = shape.map(
      (v) => new Vector(v.x + normal.x * depth, v.y + normal.y * depth, v.z + normal.z * depth)
    );

    return [...shape, ...back];
  }

  /* ───────────────────────── Faces ───────────────────────── */

  function createFrontFace(front: Vector[], holeIndices: number[]): Face {
    const flat = flattenXY(front);
    const flatTris = earcut(flat, holeIndices, 2);
    return { face: 0, triangles: toTriangles(flatTris) };
  }

  function createBackFace(front: Vector[], holeIndices: number[], offset: number): Face {
    const flat = flattenXY(front);
    const flatTris = earcut(flat, holeIndices, 2);

    const triangles: Triangle[] = [];
    for (let i = 0; i < flatTris.length; i += 3) {
      triangles.push({
        indices: [flatTris[i + 2] + offset, flatTris[i + 1] + offset, flatTris[i] + offset],
      });
    }

    return { face: 1, triangles };
  }

  function toTriangles(flat: number[]): Triangle[] {
    const triangles: Triangle[] = [];
    for (let i = 0; i < flat.length; i += 3) {
      triangles.push({ indices: [flat[i], flat[i + 1], flat[i + 2]] });
    }
    return triangles;
  }

  function flattenXY(verts: Vector[]): number[] {
    const flat: number[] = [];
    for (const v of verts) flat.push(v.x, v.y);
    return flat;
  }

  /* ───────────────────────── Side Faces ───────────────────────── */

  function createSideFacesForLoop(
    loop: Vector[],
    baseIdx: number,
    backOffset: number,
    faceIdxStart: number
  ): Face[] {
    const faces: Face[] = [];

    for (let i = 0; i < loop.length; i++) {
      const frontA = baseIdx + i;
      const frontB = baseIdx + ((i + 1) % loop.length);
      const backA = frontA + backOffset;
      const backB = frontB + backOffset;

      faces.push({
        face: faceIdxStart + faces.length,
        triangles: [{ indices: [frontA, backA, backB] }, { indices: [frontA, backB, frontB] }],
      });
    }

    return faces;
  }

  /* ───────────────────────── Utilities ───────────────────────── */

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
