import { Vector } from "../Vector";

/**
 * Utility functions for vector mathematical operations.
 */
export namespace VectorMath {
  /**
   * Computes the normal vector of a polygon using Newell's method.
   * @param vertices - Array of vertices defining the polygon in order (clockwise or counter-clockwise)
   * @returns A normalized vector perpendicular to the polygon surface
   */
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
    const magnitude = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    return new Vector(v.x / magnitude, v.y / magnitude, v.z / magnitude);
  }
}
