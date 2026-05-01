import { VectorMath } from "../spatial/vector";
import { Vector } from "../vector";
import { TriangulationUtils } from "./utils";

export function bridgeHolesToBoundary(outer: Vector[], holes: Vector[][]): Vector[] {
  if (holes.length === 0) return [...outer];

  const result = [...outer];
  TriangulationUtils.ensureWinding(result, "CCW");

  // Sort holes by rightmost vertex x-coordinate (rightmost first)
  const sortedHoles = [...holes].sort((a, b) => {
    return rightmostVertex(b).x - rightmostVertex(a).x;
  });

  for (const hole of sortedHoles) {
    const holeCopy = [...hole];
    TriangulationUtils.ensureWinding(holeCopy, "CW");

    const anchor = rightmostVertex(holeCopy);
    const visibleIdx = findVisibleVertexIndex(anchor, result);

    if (visibleIdx === -1) {
      throw new Error("No visible vertex found for hole");
    }

    const bridge = rotatedLoopFrom(holeCopy, anchor);
    result.splice(visibleIdx + 1, 0, ...bridge, result[visibleIdx]);
  }

  return result;
}

function rotatedLoopFrom(vertices: Vector[], start: Vector): Vector[] {
  const i = vertices.findIndex((v) => v.x === start.x && v.y === start.y);
  const rotated = [...vertices.slice(i), ...vertices.slice(0, i)];
  return [...rotated, new Vector(start.x, start.y, start.z)];
}

function findVisibleVertexIndex(m: Vector, boundary: Vector[]): number {
  let closestIntersection: Vector | null = null;
  let closestDist = Infinity;
  let closestEdgeIdx = -1;

  // Cast ray to the right from m, find closest edge intersection
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i];
    const b = boundary[(i + 1) % boundary.length];

    if (!edgeIntersectsRay(m, a, b)) continue;

    const ix = getIntersectionX(m, a, b);
    const dist = ix - m.x;

    if (dist > 0 && dist < closestDist) {
      closestDist = dist;
      closestIntersection = new Vector(ix, m.y, 0);
      closestEdgeIdx = i;
    }
  }

  if (closestEdgeIdx === -1) return -1;

  const a = boundary[closestEdgeIdx];
  const b = boundary[(closestEdgeIdx + 1) % boundary.length];

  // Check if intersection is exactly on a vertex
  const exactIdx = boundary.findIndex(
    (v) =>
      Math.abs(v.x - closestIntersection!.x) < VectorMath.EPSILON &&
      Math.abs(v.y - closestIntersection!.y) < VectorMath.EPSILON
  );
  if (exactIdx !== -1) return exactIdx;

  // Pick the rightmost endpoint of the intersected edge as candidate
  const candidateIdx = a.x > b.x ? closestEdgeIdx : (closestEdgeIdx + 1) % boundary.length;
  const candidate = boundary[candidateIdx];

  // Find reflex vertices inside the triangle (m, intersection, candidate)
  const reflexInTriangle: { idx: number; angle: number }[] = [];

  for (let i = 0; i < boundary.length; i++) {
    if (i === candidateIdx) continue;

    const v = boundary[i];
    if (!isReflex(i, boundary)) continue;

    if (pointInTriangle(m, closestIntersection!, candidate, v)) {
      const angle = Math.atan2(v.y - m.y, v.x - m.x);
      reflexInTriangle.push({ idx: i, angle });
    }
  }

  if (reflexInTriangle.length === 0) return candidateIdx;

  // Return the reflex vertex with smallest angle from ray
  const rayAngle = 0; // ray goes straight right
  reflexInTriangle.sort((a, b) => Math.abs(a.angle - rayAngle) - Math.abs(b.angle - rayAngle));
  return reflexInTriangle[0].idx;
}

function edgeIntersectsRay(m: Vector, a: Vector, b: Vector): boolean {
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);

  // Ray at m.y must cross edge vertically (exclusive top to handle corners)
  if (m.y < minY || m.y >= maxY) return false;

  // Compute x at intersection
  const ix = getIntersectionX(m, a, b);
  return ix > m.x;
}

function getIntersectionX(m: Vector, a: Vector, b: Vector): number {
  if (Math.abs(b.y - a.y) < VectorMath.EPSILON) return Math.min(a.x, b.x);
  const t = (m.y - a.y) / (b.y - a.y);
  return a.x + t * (b.x - a.x);
}

function isReflex(idx: number, boundary: Vector[]): boolean {
  const n = boundary.length;
  const prev = boundary[(idx - 1 + n) % n];
  const curr = boundary[idx];
  const next = boundary[(idx + 1) % n];
  return TriangulationUtils.isConcave(prev, curr, next);
}

function pointInTriangle(a: Vector, b: Vector, c: Vector, p: Vector): boolean {
  const sign = (p1: Vector, p2: Vector, p3: Vector) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);

  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(hasNeg && hasPos);
}

function rightmostVertex(vertices: Vector[]): Vector {
  return vertices.reduce((a, b) => (b.x > a.x ? b : a));
}
