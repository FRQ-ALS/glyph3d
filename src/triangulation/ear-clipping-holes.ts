import { VectorMath } from "../spatial/vector";
import { Vector } from "../vector";
import { TriangulationUtils } from "./utils";

type HoleBridge = {
  insertAfter: number;
  bridge: Vector[];
};

export function bridgeHolesToBoundary(outer: Vector[], holes: Vector[][]): Vector[] {
  const bridges = holes
    .map((hole) => computeHoleBridge(hole, outer))
    .sort((a, b) => averageX(a.bridge) - averageX(b.bridge));

  const result = [...outer];

  for (const { insertAfter, bridge } of bridges) {
    result.splice(insertAfter + 1, 0, ...bridge, outer[insertAfter]);
  }

  return result;
}

function computeHoleBridge(hole: Vector[], outer: Vector[]): HoleBridge {
  TriangulationUtils.ensureWinding(hole, "CW");
  TriangulationUtils.ensureWinding(outer, "CCW");

  const anchor = rightmostVertex(hole);
  const visible = findVisibleOuterVertex(anchor, outer);

  return {
    insertAfter: outer.indexOf(visible),
    bridge: rotatedLoopFrom(hole, anchor),
  };
}

function rotatedLoopFrom(vertices: Vector[], start: Vector): Vector[] {
  const i = vertices.indexOf(start);
  const rotated = [...vertices.slice(i), ...vertices.slice(0, i)];

  // explicit copy — no magic clone
  return [...rotated, new Vector(start.x, start.y, start.z)];
}

function findVisibleOuterVertex(m: Vector, outer: Vector[]): Vector {
  const rayEnd = new Vector(rightmostVertex(outer).x + VectorMath.EPSILON, m.y, 0);

  for (let i = 0; i < outer.length; i++) {
    const a = outer[i];
    const b = outer[(i + 1) % outer.length];

    if (!intersectsRightRay(m, a, b)) continue;

    const intersection = intersect(m, rayEnd, a, b);
    const exact = vertexAt(intersection, outer);
    if (exact) return exact;

    const candidate = a.x > b.x ? a : b;
    const blockers = reflexVertices(outer).filter((v) =>
      insideTriangle(m, intersection, candidate, v)
    );

    if (blockers.length === 0) return candidate;

    return smallestAngleFrom(m, intersection, blockers);
  }

  throw new Error("No mutually visible vertex found");
}

function intersect(a: Vector, b: Vector, c: Vector, d: Vector): Vector {
  const { x, y } = TriangulationUtils.findLineIntersection(a, b, c, d);
  return new Vector(x, y, 0);
}

export function intersectsRightRay(m: Vector, a: Vector, b: Vector): boolean {
  if (a.y > m.y || b.y < m.y) return false;
  if (a.x < m.x || b.x < m.x) return false;
  return true;
}

function insideTriangle(a: Vector, b: Vector, c: Vector, p: Vector): boolean {
  return TriangulationUtils.containsVertex(a, b, c, p);
}

function reflexVertices(vertices: Vector[]): Vector[] {
  return vertices.filter((v, i) =>
    TriangulationUtils.isConcave(
      vertices[(i - 1 + vertices.length) % vertices.length],
      v,
      vertices[(i + 1) % vertices.length]
    )
  );
}

function smallestAngleFrom(m: Vector, i: Vector, vertices: Vector[]): Vector {
  return vertices.reduce((best, v) =>
    VectorMath.angle(i, m, v) < VectorMath.angle(i, m, best) ? v : best
  );
}


function rightmostVertex(vertices: Vector[]): Vector {
  return vertices.reduce((a, b) => (b.x > a.x ? b : a));
}

function vertexAt(p: Vector, vertices: Vector[]): Vector | null {
  return vertices.find((v) => v.x === p.x && v.y === p.y) ?? null;
}

function averageX(vertices: Vector[]): number {
  return vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
}
