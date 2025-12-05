import { Vector } from "../vector";

/**
 * Utility functions for vector mathematical operations.
 */
export namespace VectorMath {
  /**
   * Computes the normal vector of a polygon using Newell's method.
   * @param vertices - Array of vertices defining the polygon in order (clockwise or counter-clockwise)
   * @returns A normalized vector perpendicular to the polygon surface
   */
  export const EPSILON = 1e-6;
  export function computeNormalNewells(vertices: Array<Vector>): Vector {
    let x = 0;
    let y = 0;
    let z = 0;

    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      const curr = vertices[i];
      const nextVert = vertices[next];

      x += (curr.y - nextVert.y) * (curr.z + nextVert.z);
      y += (curr.z - nextVert.z) * (curr.x + nextVert.x);
      z += (curr.x - nextVert.x) * (curr.y + nextVert.y);
    }

    return normalize(new Vector(x, y, z));
  }

  /**
   * Normalizes a vector to unit length.
   *
   * @param v - The vector to normalize
   * @returns A new vector with the same direction but magnitude of 1
   */
  export function normalize(v: Vector): Vector {
    const magnitude = Math.max(Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2), EPSILON);
    return new Vector(v.x / magnitude, v.y / magnitude, v.z / magnitude);
  }

  export function dot(a: Vector, b: Vector) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  export function subtract(a: Vector, b: Vector): Vector {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z,
    };
  }

  export function magnitude(v: Vector): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  export function cross(a: Vector, b: Vector): Vector {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }
}
