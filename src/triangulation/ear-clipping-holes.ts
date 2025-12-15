import { Vector } from "../vector";
import { Triangulation } from "./triangulation";

export function resolveHoles(face: Array<Vector>, holes: Array<Array<Vector>>): Array<Vector> {
  holes.forEach((hole: Array<Vector>) => {
    const holeCW = Triangulation.ensureWinding(hole, "CW");
    const rightMostVtx = findRightMostVtx(holeCW);
  });
  return [];
}

// Finds rightmost vertex within hole
function findRightMostVtx(hole: Array<Vector>) {
  let currIdx = 0;

  hole.forEach((v: Vector, idx: number) => {
    if (v.x > hole[currIdx].x) {
      currIdx = idx;
    }
  });

  return currIdx;
}
// https://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf
// David Eberly, Geometric Tools, Redmond WA 98052
function findMutuallyVisiblePoint(vtx: Vector, shape: Array<Vector>) {
  // 1.intesect M + t(1,0) with all directed edges of outer polygon for which M is to the left
  // go through all edges (vi, vi + 1), find edges that are to the right of M completely
  // intersect  M + t(1,0)  with all these edges
  // intesect needs to happen where vi+1 is above or on the ray, and vi is below or on the ray, useful for multiple holes
  // let I be the closest point visible to M on the ray, find the edge essentially with the lowest t value
  // if I is a vertex of the outer polygon, then algo terminates
  // otherwise I is an interior point on that edge. In that case select P to be the endpoint of maximum x value on that edge
  // if that point P is a reflex**, search through all other reflex vertices not including P. If all these points are stricly outside triangel MIP, then M and P are mutually visible and algo terminates
  // Otherwise search for point R where angle between MI and MR are lowest, then R is mutually visible with M and algo terminates
  // ** reflex points are when interior angle at that point is greater than 180, so the polygon bends inwards.\

  // 1.

  for (let i = 0; i < shape.length; i++) {
    const next = (i + 1) % shape.length;
    // before we even do anything, check if both points are to the right of our point
    if (shape[i].x >= vtx.x && shape[next].x >= vtx.x) {
      findIntersectingEdge(vtx, shape[i], shape[next]);
    }
  }
}

function findIntersectingEdge(v: Vector, a: Vector, b: Vector) {}
