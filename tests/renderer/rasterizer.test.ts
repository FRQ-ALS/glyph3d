import { Renderer } from "src/renderer";
import { Vector } from "src/vector";

describe("Renderer rasterizer viewport clamping", () => {
  test("triangle far outside viewport doesn't blow past the per-cell bound", () => {
    const r: any = new Renderer(2, 100, 100);
    r.collectTrianglePixels(
      new Vector(-1_000_000, -1_000_000, -1),
      new Vector(2_000_000, -1_000_000, -1),
      new Vector(-1_000_000, 2_000_000, -1),
      0,
      "#fff"
    );
    const cellsInViewport = 51 * 51;
    expect(r.pixelBuffer.length).toBeLessThanOrEqual(cellsInViewport);
  });

  test("collectScanLine z-interpolation uses unclamped range when bounds are clamped", () => {
    const r: any = new Renderer(2, 100, 100);
    // Scan line spans x=[-50, 150] with z=[-10, -20] => z(0) = -10 + (-20 - -10) * (50/200) = -12.5
    r.collectScanLine(-50, 150, 50, -10, -20, "#", "red", 0);

    const p = r.pixelBuffer.find((px: any) => px.gridX === 0);
    expect(p).toBeDefined();
    expect(p.z).toBeCloseTo(-12.5);

    // No pixel below the clamp boundary
    expect(r.pixelBuffer.every((px: any) => px.gridX >= 0)).toBe(true);
    expect(r.pixelBuffer.every((px: any) => px.gridX < 50)).toBe(true);
  });

  test("split (general) triangle produces pixels whose z stays within the original vertex z range", () => {
    const r: any = new Renderer(2, 200, 200);
    r.rasterizeTriangleToBuffer(
      new Vector(50, 10, -1),
      new Vector(10, 50, -3),
      new Vector(90, 100, -5),
      "#",
      "red",
      0
    );

    expect(r.pixelBuffer.length).toBeGreaterThan(0);
    for (const p of r.pixelBuffer) {
      expect(p.z).toBeGreaterThanOrEqual(-5 - 1e-6);
      expect(p.z).toBeLessThanOrEqual(-1 + 1e-6);
    }
  });
});
