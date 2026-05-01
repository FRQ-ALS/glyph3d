import { Renderer } from "src/renderer";
import { Vector } from "src/vector";
import { fakeCamera } from "../helpers";

describe("Renderer.applyFrustumCulling", () => {
  const newRenderer = () => new Renderer(6, 800, 600);
  const cam = fakeCamera({ location: new Vector(0, 0, 0) });

  test("triangle entirely behind camera (all v.z >= 0) is culled", () => {
    const r = newRenderer();
    const ok = r.applyFrustumCulling(
      new Vector(0, 0, 0),
      new Vector(1, 0, 0.5),
      new Vector(0, 1, 1),
      cam
    );
    expect(ok).toBe(false);
  });

  test("triangle entirely off the left side of the frustum is culled", () => {
    const r = newRenderer();
    const ok = r.applyFrustumCulling(
      new Vector(-100, 0, -1),
      new Vector(-100, 1, -1),
      new Vector(-100, -1, -1),
      cam
    );
    expect(ok).toBe(false);
  });

  test("triangle entirely off the bottom of the frustum is culled", () => {
    const r = newRenderer();
    const ok = r.applyFrustumCulling(
      new Vector(0, -100, -1),
      new Vector(1, -100, -1),
      new Vector(-1, -100, -1),
      cam
    );
    expect(ok).toBe(false);
  });

  test("partially-visible triangle is kept", () => {
    const r = newRenderer();
    const ok = r.applyFrustumCulling(
      new Vector(0, 0, -10),
      new Vector(1, 0, -10),
      new Vector(0, 1, -10),
      cam
    );
    expect(ok).toBe(true);
  });

  test("aspect ratio widens the horizontal frustum", () => {
    const wide = new Renderer(6, 1600, 100);
    const square = new Renderer(6, 100, 100);
    const v0 = new Vector(-3, 0, -1);
    const v1 = new Vector(-3, 1, -1);
    const v2 = new Vector(-3, -1, -1);
    expect(wide.applyFrustumCulling(v0, v1, v2, cam)).toBe(true);
    expect(square.applyFrustumCulling(v0, v1, v2, cam)).toBe(false);
  });

  test("returns false when camera location is missing", () => {
    const r = newRenderer();
    const noLocCam = fakeCamera();
    noLocCam.state.location = undefined;
    const ok = r.applyFrustumCulling(
      new Vector(0, 0, -10),
      new Vector(1, 0, -10),
      new Vector(0, 1, -10),
      noLocCam
    );
    expect(ok).toBe(false);
  });
});

describe("Renderer.isFacingCamera (screen-space cross product sign)", () => {
  const r: any = new Renderer(6, 100, 100);

  test("positive cross product (CCW in canvas-Y-down) returns true", () => {
    expect(
      r.isFacingCamera(
        new Vector(0, 0, 0),
        new Vector(10, 0, 0),
        new Vector(0, 10, 0)
      )
    ).toBe(true);
  });

  test("negative cross product (reversed winding) returns false", () => {
    expect(
      r.isFacingCamera(
        new Vector(0, 0, 0),
        new Vector(0, 10, 0),
        new Vector(10, 0, 0)
      )
    ).toBe(false);
  });

  test("collinear (degenerate) triangle returns false", () => {
    expect(
      r.isFacingCamera(
        new Vector(0, 0, 0),
        new Vector(10, 0, 0),
        new Vector(20, 0, 0)
      )
    ).toBe(false);
  });
});
