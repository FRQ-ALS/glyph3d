import { bridgeHolesToBoundary } from "src/triangulation/ear-clipping-holes";
import { earcut } from "src/triangulation/ear-clipping";
import { Vector } from "src/vector";

const signedArea = (verts: Vector[]) => {
  let a = 0;
  for (let i = 0; i < verts.length; i++) {
    const p = verts[i];
    const q = verts[(i + 1) % verts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
};

const triSignedArea = (a: Vector, b: Vector, c: Vector) =>
  ((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;

const ccwSquare = (cx: number, cy: number, half: number): Vector[] => [
  new Vector(cx - half, cy - half, 0),
  new Vector(cx + half, cy - half, 0),
  new Vector(cx + half, cy + half, 0),
  new Vector(cx - half, cy + half, 0),
];

const cwSquare = (cx: number, cy: number, half: number): Vector[] =>
  ccwSquare(cx, cy, half).reverse();

describe("bridgeHolesToBoundary", () => {
  test("merged area = outer area − hole area for a single CCW-defined hole", () => {
    const outer = ccwSquare(0, 0, 50); // area 10000
    const hole = ccwSquare(0, 0, 5); // area 100, defined CCW

    const merged = bridgeHolesToBoundary(outer, [hole]);

    // Expected merged signed area = 10000 - 100 = 9900.
    expect(signedArea(merged)).toBeCloseTo(9900, 6);
  });

  test("merged area is the same regardless of whether holes are passed CCW or CW", () => {
    const outer = ccwSquare(0, 0, 50);
    const holeCCW = ccwSquare(10, 10, 5);
    const holeCW = cwSquare(10, 10, 5);

    const fromCCW = bridgeHolesToBoundary(outer, [holeCCW]);
    const fromCW = bridgeHolesToBoundary(outer, [holeCW]);

    expect(signedArea(fromCCW)).toBeCloseTo(signedArea(fromCW), 6);
  });

  test("merged area = outer − Σholes for multiple CCW-defined holes", () => {
    const outer = ccwSquare(0, 0, 50); // 10000
    const holes = [
      ccwSquare(-30, -30, 5), // 100
      ccwSquare(30, -30, 5), // 100
      ccwSquare(30, 30, 5), // 100
      ccwSquare(-30, 30, 5), // 100
    ];

    const merged = bridgeHolesToBoundary(outer, holes);

    expect(signedArea(merged)).toBeCloseTo(10000 - 4 * 100, 6);
  });

  test("merged polygon contains every original outer and hole vertex", () => {
    const outer = ccwSquare(0, 0, 50);
    const holes = [ccwSquare(-20, 0, 5), ccwSquare(20, 0, 5)];

    const merged = bridgeHolesToBoundary(outer, holes);
    const has = (v: Vector) => merged.some((m) => m.x === v.x && m.y === v.y && m.z === v.z);

    for (const v of outer) expect(has(v)).toBe(true);
    for (const hole of holes) for (const v of hole) expect(has(v)).toBe(true);
  });

  test("outer passed CW is normalized — merged area equals outer − holes", () => {
    const outer = cwSquare(0, 0, 50); // user passed in CW
    const hole = ccwSquare(0, 0, 5);

    const merged = bridgeHolesToBoundary(outer, [hole]);

    expect(signedArea(merged)).toBeCloseTo(9900, 6);
  });
});

describe("earcut on a bridged polygon with holes", () => {
  test("triangulation total area = outer − Σholes (single hole, CCW input)", () => {
    const outer = ccwSquare(0, 0, 50);
    const hole = ccwSquare(0, 0, 5);
    const merged = bridgeHolesToBoundary(outer, [hole]);

    const tris = earcut(merged);
    const totalArea = tris.reduce((sum, t) => {
      const [i0, i1, i2] = t.indices;
      return sum + triSignedArea(merged[i0], merged[i1], merged[i2]);
    }, 0);

    expect(totalArea).toBeCloseTo(9900, 6);
  });

  test("every triangle is non-degenerate and CCW (positive signed area)", () => {
    const outer = ccwSquare(0, 0, 50);
    const holes = [
      ccwSquare(-25, -25, 5),
      ccwSquare(25, -25, 5),
      ccwSquare(25, 25, 5),
      ccwSquare(-25, 25, 5),
    ];
    const merged = bridgeHolesToBoundary(outer, holes);

    const tris = earcut(merged);
    for (const t of tris) {
      const [i0, i1, i2] = t.indices;
      const a = triSignedArea(merged[i0], merged[i1], merged[i2]);
      expect(a).toBeGreaterThan(0);
    }
  });

  test("triangulation total area = outer − Σholes for many CCW holes", () => {
    const outer = ccwSquare(0, 0, 50);
    const holes = [
      ccwSquare(-30, -30, 4),
      ccwSquare(0, -30, 4),
      ccwSquare(30, -30, 4),
      ccwSquare(-30, 0, 4),
      ccwSquare(30, 0, 4),
      ccwSquare(-30, 30, 4),
      ccwSquare(0, 30, 4),
      ccwSquare(30, 30, 4),
    ];
    const merged = bridgeHolesToBoundary(outer, holes);

    const tris = earcut(merged);
    const totalArea = tris.reduce((sum, t) => {
      const [i0, i1, i2] = t.indices;
      return sum + triSignedArea(merged[i0], merged[i1], merged[i2]);
    }, 0);

    const expected = 10000 - 8 * 64; // 10000 - 8 * (8*8)
    expect(totalArea).toBeCloseTo(expected, 6);
  });
});
