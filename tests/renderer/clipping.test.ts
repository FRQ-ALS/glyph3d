import { Renderer } from "src/renderer";
import { Vector } from "src/vector";

const NEAR = -0.01;

const newRenderer = () => new Renderer(6, 100, 100);

describe("Renderer.clipAgainstNearPlane", () => {
  test("triangle entirely behind near plane returns []", () => {
    const r: any = newRenderer();
    const tris = r.clipAgainstNearPlane(
      new Vector(0, 0, 1),
      new Vector(1, 0, 1),
      new Vector(0, 1, 1)
    );
    expect(tris).toEqual([]);
  });

  test("triangle entirely in front returns the original triangle untouched", () => {
    const r: any = newRenderer();
    const v0 = new Vector(0, 0, -10);
    const v1 = new Vector(1, 0, -10);
    const v2 = new Vector(0, 1, -10);
    const tris = r.clipAgainstNearPlane(v0, v1, v2);
    expect(tris).toHaveLength(1);
    expect(tris[0]).toEqual([v0, v1, v2]);
  });

  test("one vertex in front: single clipped triangle with intersections snapped to the plane", () => {
    const r: any = newRenderer();
    const vIn = new Vector(0, 0, -1);
    const vOut1 = new Vector(2, 0, 1);
    const vOut2 = new Vector(0, 2, 1);

    const tris = r.clipAgainstNearPlane(vIn, vOut1, vOut2);
    expect(tris).toHaveLength(1);

    const [a, b, c] = tris[0];
    expect(a).toEqual(vIn);
    expect(b.z).toBeCloseTo(NEAR);
    expect(c.z).toBeCloseTo(NEAR);

    const t = (NEAR - vIn.z) / (vOut1.z - vIn.z);
    expect(b.x).toBeCloseTo(vIn.x + (vOut1.x - vIn.x) * t);
    expect(b.y).toBeCloseTo(vIn.y + (vOut1.y - vIn.y) * t);
    expect(c.x).toBeCloseTo(vIn.x + (vOut2.x - vIn.x) * t);
    expect(c.y).toBeCloseTo(vIn.y + (vOut2.y - vIn.y) * t);
  });

  test("two vertices in front: returns two triangles forming a quad with shared diagonal", () => {
    const r: any = newRenderer();
    const vOut = new Vector(0, 0, 1);
    const vIn1 = new Vector(2, 0, -1);
    const vIn2 = new Vector(0, 2, -1);

    const tris = r.clipAgainstNearPlane(vOut, vIn1, vIn2);
    expect(tris).toHaveLength(2);

    expect(tris[0][1]).toEqual(vIn1);
    expect(tris[0][2]).toEqual(vIn2);
    expect(tris[0][0].z).toBeCloseTo(NEAR);

    expect(tris[1][0]).toEqual(tris[0][0]);
    expect(tris[1][1]).toEqual(vIn2);
    expect(tris[1][2].z).toBeCloseTo(NEAR);
  });

  test("vertex sitting exactly at the near plane is treated as outside (strict <)", () => {
    const r: any = newRenderer();
    const v0 = new Vector(0, 0, NEAR);
    const v1 = new Vector(1, 0, 1);
    const v2 = new Vector(0, 1, 1);
    const tris = r.clipAgainstNearPlane(v0, v1, v2);
    expect(tris).toEqual([]);
  });
});
