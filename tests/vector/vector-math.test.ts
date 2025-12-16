import { VectorMath } from "src/spatial/vector";

describe("VectorMath.angle", () => {
  test("returns 0 for same direction", () => {
    const B = { x: 0, y: 0, z: 0 };
    const A = { x: 1, y: 0, z: 0 };
    const C = { x: 2, y: 0, z: 0 };

    expect(VectorMath.angle(A, B, C)).toBeCloseTo(0);
  });

  test("returns 90 degrees for perpendicular vectors", () => {
    const B = { x: 0, y: 0, z: 0 };
    const A = { x: 1, y: 0, z: 0 };
    const C = { x: 0, y: 1, z: 0 };

    expect(VectorMath.angle(A, B, C)).toBeCloseTo(Math.PI / 2);
  });

  test("returns 180 degrees for opposite directions", () => {
    const B = { x: 0, y: 0, z: 0 };
    const A = { x: 1, y: 0, z: 0 };
    const C = { x: -1, y: 0, z: 0 };

    expect(VectorMath.angle(A, B, C)).toBeCloseTo(Math.PI);
  });

  test("angle is independent of vector length", () => {
    const B = { x: 0, y: 0, z: 0 };
    const A = { x: 10, y: 0, z: 0 };
    const C = { x: 0, y: 5, z: 0 };

    expect(VectorMath.angle(A, B, C)).toBeCloseTo(Math.PI / 2);
  });
});
