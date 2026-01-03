import { VectorMath } from "../spatial/vector";
import { Vector } from "../vector";
import { TriangulationUtils } from "./utils";

/**
 * Finds a mutually visible vertex between a hole and an outer polygon boundary.
 *
 * This algorithm connects holes to the outer polygon by finding a vertex on the
 * outer boundary that is visible from a point M on the hole (typically the
 * rightmost vertex of the hole).
 *
 * Algorithm steps:
 * 1. Cast a ray from M in the +x direction: M + t(1,0)
 * 2. Find all edges (vᵢ, vᵢ₊₁) of the outer polygon where M lies to the left
 *    of the edge (i.e., the edge is entirely to the right of M)
 * 3. Intersect the ray with these edges, considering only edges where vᵢ₊₁ is
 *    above or on the ray and vᵢ is below or on the ray (handles multiple holes)
 * 4. Let I be the closest intersection point (minimum t value)
 * 5. If I is a vertex of the outer polygon, return I as the mutually visible point
 * 6. Otherwise, I lies on an edge interior. Let P be the endpoint of that edge
 *    with maximum x-coordinate
 * 7. If P is a reflex vertex, check all other reflex vertices R (excluding P):
 *    - If all reflex vertices lie strictly outside triangle MIP, then M and P
 *      are mutually visible; return P
 *    - Otherwise, find the reflex vertex R that minimizes the angle ∠IMR;
 *      return R as the mutually visible point
 *
 * Note: A reflex vertex is one where the interior angle exceeds 180°, causing
 * the polygon boundary to bend inward at that point.
 *
 * @see {@link https://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf}
 *      "Triangulation by Ear Clipping" by David Eberly, Geometric Tools
 */

export function resolveHoles(shape: Array<Vector>, holes: Array<Array<Vector>>): Array<Vector> {
  // instead of overwriting on top of the shape, for each  hole generate the entry point, the hole, the exit point. Then combine everything at the end
  const paths: any = [];
  let finalShape = shape;
  holes.forEach((hole: Array<Vector>) => {
    const path = getHolePath(hole, shape);
    paths.push(path);
  });

  paths.sort(function (a: any, b: any) {
    return findAverageX(a.hole) - findAverageX(b.hole);
  });

  paths.forEach((path: any) => {
    path.hole.push(shape[path.entryIdx]);
    finalShape.splice(path.entryIdx + 1, 0, ...path.hole);
  });

  return finalShape;
}
function findAverageX(shape: any[]) {
  let total = 0;

  shape.forEach((vert: any) => {
    total += vert.x;
  });
  return total / shape.length;
}

function getHolePath(
  hole: any,
  shape: any
): {
  entryIdx: number;
  hole: Array<Vector>;
} {
  const holeCW = TriangulationUtils.ensureWinding(hole, "CW");
  const shapeCCW = TriangulationUtils.ensureWinding(shape, "CCW");
  const rightMostVtx = TriangulationUtils.findRightMostVtx(holeCW);
  const mutual = findMutuallyVisiblePoint(holeCW[rightMostVtx], shapeCCW);

  const vertex = shapeCCW.indexOf(mutual);

  // Accumulate each bridge into mergedShape
  const mergedShape = buildBridge(rightMostVtx, vertex, holeCW, shapeCCW);
  return { entryIdx: vertex, hole: mergedShape };
}

// i - rightmost vertex idx
// v - mutually visible point idx
function buildBridge(i: number, v: number, hole: Array<Vector>, shape: Array<Vector>) {
  const rotatedHole = hole.slice(i).concat(hole.slice(0, i));
  const bridge = [
    ...rotatedHole, // All hole vertices starting from i
    new Vector(hole[i].x, hole[i].y, hole[i].z), // Back to starting hole vertex (NEW instance)
  ];

  return bridge;
}

export function findMutuallyVisiblePoint(vtx: Vector, shape: Array<Vector>): Vector {
  // Need to define a ray emitting to the right of point M (vtx), so need it to pass through all possible shape vertices
  const rightMostPoint = new Vector(
    shape[TriangulationUtils.findRightMostVtx(shape)].x + VectorMath.EPSILON, // ensure line stretches past shape sloghtly
    vtx.y,
    0
  );

  for (let i = 0; i < shape.length; i++) {
    const next = (i + 1) % shape.length;
    // before we even do anything, check if both points are to the right of our point
    if (!isEdgeIntersectingRayFromRight(vtx, shape[i], shape[next])) continue;

    const I = TriangulationUtils.findLineIntersection(vtx, rightMostPoint, shape[i], shape[next]);
    const pointWithinshape = findPointInshape(new Vector(I.x, I.y, 0), shape);

    // If the intersection point is a vertex within outer shape, terminate algo
    if (pointWithinshape.found) {
      return pointWithinshape.point;
    }

    // If not, select the rightmost point from current edge
    const P = shape[i].x > shape[next].x ? shape[i] : shape[next];
    const reflexVertices = searchForReflexVertices(shape);

    const reflexVerticesWithinMIP = areReflexVerticesOutsideTriangle(
      vtx,
      new Vector(I.x, I.y, 0),
      P,
      reflexVertices
    );

    if (reflexVerticesWithinMIP.length === 0) {
      return P;
    }

    // Otherwise, out of all the reflex vertices that lie in MIP, select one with lowest angle betwwen MI & MR
    const R = findVertexWithSmallestAngle(vtx, new Vector(I.x, I.y, 0), reflexVerticesWithinMIP);
    return R;
  }

  return new Vector(0, 0, 0);
}

function findVertexWithSmallestAngle(m: Vector, i: Vector, reflexVerts: Array<Vector>) {
  let min = Infinity; // start with a very large number
  let vert: Vector | null = null;
  for (const vertex of reflexVerts) {
    const angle = VectorMath.angle(i, m, vertex);
    if (angle < min) {
      min = angle;
      vert = vertex;
    }
  }
  if (!vert) {
    throw new Error("No vertex found for smallest angle");
  }
  return vert;
}

function areReflexVerticesOutsideTriangle(
  m: Vector,
  i: Vector,
  p: Vector,
  reflexVerts: Array<Vector>
) {
  const result = [];
  for (const vertex of reflexVerts) {
    if (TriangulationUtils.containsVertex(m, i, p, vertex)) {
      result.push(vertex);
    }
  }
  return result;
}

// Reflex is interchangable with concave
function searchForReflexVertices(shape: Array<Vector>) {
  const result = [];
  for (let i = 0; i < shape.length; i++) {
    const next = (i + 1) % shape.length;
    const prev = i === 0 ? shape.length - 1 : i - 1;

    if (TriangulationUtils.isConcave(shape[prev], shape[i], shape[next])) {
      result.push(shape[i]);
    }
  }
  return result;
}

function findPointInshape(
  p: Vector,
  shape: Array<Vector>
): { found: boolean; point: Vector } | { found: false } {
  for (const vertex of shape) {
    if (vertex.x === p.x && vertex.y === p.y) {
      return { found: true, point: vertex };
    }
  }
  return { found: false };
}

/**
 * Determines whether an edge satisfies the ray-intersection criteria.
 *
 * An edge is considered valid if:
 * - The starting vertex (vi) lies on or below the ray
 * - The ending vertex (vi + 1) lies on or above the ray
 * - The entire edge (two endpoints) lies to the right of point M
 */
export function isEdgeIntersectingRayFromRight(m: Vector, v1: Vector, v2: Vector): boolean {
  if (v1.y > m.y) {
    return false;
  }

  if (v2.y < m.y) {
    return false;
  }

  if (v1.x < m.x || v2.x < m.x) {
    return false;
  }
  return true;
}
