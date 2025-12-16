import { Vector } from "src/vector";
import { TriangulationUtils } from "src/triangulation";

describe("Triangulation", () => {
  describe("ensureWinding", () => {
    const ccwSquare: Vector[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 0 },
    ];

    it("returns same vertices if winding already CCW", () => {
      const result = TriangulationUtils.ensureWinding(ccwSquare, "CCW");
      expect(result).toEqual(ccwSquare);
    });

    it("reverses vertices if winding is wrong", () => {
      const cw = [...ccwSquare].reverse();
      const result = TriangulationUtils.ensureWinding(cw, "CCW");
      expect(result).toEqual(ccwSquare);
    });
  });

  describe("isConvex", () => {
    it("returns true for a left turn (convex CCW)", () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 1, y: 0, z: 0 };
      const c = { x: 1, y: 1, z: 0 };

      expect(TriangulationUtils.isConvex(a, b, c)).toBe(true);
    });

    it("returns false for a right turn (concave / CW)", () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 1, y: 1, z: 0 };
      const c = { x: 1, y: 0, z: 0 };

      expect(TriangulationUtils.isConvex(a, b, c)).toBe(false);
    });
  });

  describe("containsVertex", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 2, y: 0, z: 0 };
    const c = { x: 0, y: 2, z: 0 };

    it("returns true when point is inside triangle", () => {
      const p = { x: 0.5, y: 0.5, z: 0 };
      expect(TriangulationUtils.containsVertex(a, b, c, p)).toBe(true);
    });

    it("returns false when point is outside triangle", () => {
      const p = { x: 2, y: 2, z: 0 };
      expect(TriangulationUtils.containsVertex(a, b, c, p)).toBe(false);
    });

    it("returns true when point lies on an edge", () => {
      const p = { x: 1, y: 0, z: 0 };
      expect(TriangulationUtils.containsVertex(a, b, c, p)).toBe(true);
    });
  });

  describe("findLineIntersection", () => {
    it("finds correct intersectoin", () => {
      const a1 = new Vector(0, 0, 0);
      const a2 = new Vector(4, 4, 0);

      const b1 = new Vector(0, 4, 0);
      const b2 = new Vector(4, 0, 0);

      const result = TriangulationUtils.findLineIntersection(a1, a2, b1, b2);
      expect(result.x).toBe(2);
      expect(result.y).toBe(2);
    });
  });
});
