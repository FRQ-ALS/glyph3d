import {
  isEdgeIntersectingRayFromRight,
  resolveHoles,
  findMutuallyVisiblePoint,
} from "src/triangulation/ear-clipping-holes";
import { earcut } from "src/triangulation/ear-clipping";
import { Vector } from "src/vector";

describe("isEdgeIntersectingRayFromRight", () => {
  const M: Vector = { x: 0, y: 0, z: 0 };

  test("returns true when edge crosses the ray and is to the right of M", () => {
    const v1: Vector = { x: 1, y: -1, z: 0 };
    const v2: Vector = { x: 2, y: 1, z: 0 };
    expect(isEdgeIntersectingRayFromRight(M, v1, v2)).toBe(true);
  });

  test("returns false when edge is fully below the ray", () => {
    const v1: Vector = { x: 1, y: -2, z: 0 };
    const v2: Vector = { x: 2, y: -1, z: 0 };
    expect(isEdgeIntersectingRayFromRight(M, v1, v2)).toBe(false);
  });

  test("returns false when edge is to the left of M", () => {
    const v1: Vector = { x: -1, y: -1, z: 0 };
    const v2: Vector = { x: 1, y: 1, z: 0 };
    expect(isEdgeIntersectingRayFromRight(M, v1, v2)).toBe(false);
  });
});

describe("resolveHoles", () => {
  test("should return properly resovled vertices matrix with holes", () => {
    const hexagon = [
      new Vector(300, 0, 0),
      new Vector(150, 259.8, 0),
      new Vector(-150, 259.8, 0),
      new Vector(-300, 0, 0),
      new Vector(-150, -259.8, 0),
      new Vector(150, -259.8, 0),
    ];

    const squareHole = [
      new Vector(-150, 150, 0),
      new Vector(90, 150, 0),
      new Vector(150, -150, 0),
      new Vector(-150, -150, 0),
    ];

    const resolved = resolveHoles(hexagon, [squareHole]);
    const faces = earcut(resolved);
    console.log(faces);
    console.log(resolved);
  });
});
