import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";

export namespace TriangulationUtils {
  // ensure Counter Clockwise
  export type Winding = "CW" | "CCW";

  export function ensureWinding(vs: Vector[], winding: Winding): Vector[] {
    let area = 0;

    for (let i = 0; i < vs.length; i++) {
      const v1 = vs[i];
      const v2 = vs[(i + 1) % vs.length];
      area += v1.x * v2.y - v2.x * v1.y;
    }

    const isCCW = area > 0;
    const shouldBeCCW = winding === "CCW";

    return isCCW === shouldBeCCW ? vs : [...vs].reverse();
  }

  export function isConvex(a: Vector, b: Vector, c: Vector) {
    return VectorMath.scalarCross2D(a, b, c) > 0;
  }

  // does triangle abc contain vertex p
  export function containsVertex(a: Vector, b: Vector, c: Vector, p: Vector) {
    // barycentric sign method (correct)
    const cross1 = VectorMath.sign(p, a, b);
    const cross2 = VectorMath.sign(p, b, c);
    const cross3 = VectorMath.sign(p, c, a);

    const hasNeg = cross1 < 0 || cross2 < 0 || cross3 < 0;
    const hasPos = cross1 > 0 || cross2 > 0 || cross3 > 0;

    // inside = all same sign OR zero
    return !(hasNeg && hasPos);
  }

  export function findLineIntersection(a1: Vector, a2: Vector, b1: Vector, b2: Vector) {
    const lineOne = {
      a: a2.y - a1.y,
      b: a1.x - a2.x,
    };
    const lineOneC = lineOne.a * a1.x + lineOne.b * a1.y;

    const lineTwo = {
      a: b2.y - b1.y,
      b: b1.x - b2.x,
    };
    const lineTwoC = lineTwo.a * b1.x + lineTwo.b * b1.y;

    const denominator = lineOne.a * lineTwo.b - lineTwo.a * lineOne.b;
    const x = (lineOneC * lineTwo.b - lineTwoC * lineOne.b) / denominator;
    const y = (lineOne.a * lineTwoC - lineTwo.a * lineOneC) / denominator;

    return { x, y };
  }
}
