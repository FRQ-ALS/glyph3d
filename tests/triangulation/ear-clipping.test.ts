import { earcut } from "src/triangulation/ear-clipping";
import { Vector } from "src/vector";

describe("earcut", () => {
  test("returns valid triangulated faces for a convex polygon", () => {
    const hexagon = [
      new Vector(300, 0, 0),
      new Vector(150, 259.8, 0),
      new Vector(-150, 259.8, 0),
      new Vector(-300, 0, 0),
      new Vector(-150, -259.8, 0),
      new Vector(150, -259.8, 0),
    ];

    const expected = [
      [0, 1, 5],
      [1, 2, 5],
      [2, 3, 5],
      [3, 4, 5],
    ].map((indices) => indices.sort());

    const faces = earcut(hexagon);
    expect(faces).toHaveLength(expected.length);

    const result = faces.map((face) => [...face.indices].sort());
    expect(result).toEqual(expected);
  });
});
