import { Renderer } from "src/renderer";
import { Vector } from "src/vector";
import { DirectionalLight, PointLight, SpotLight } from "src/light";
import { fakeCamera, makeFakeCanvas } from "../helpers";

const triFace = (i0: number, i1: number, i2: number, faceIdx = 0) => ({
  face: faceIdx,
  triangles: [{ indices: [i0, i1, i2] as [number, number, number] }],
});

describe("DirectionalLight integration", () => {
  test("face perpendicular to the light is brighter than a face facing away", () => {
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const light = new DirectionalLight(new Vector(0, 0, -1), 1);

    // Engine-front winding: cross-product normal points away from camera (-Z in camera space).
    // Light travels along -Z, so dot(normal, light) > 0 — fully lit.
    const facingLight = [new Vector(-1, -1, -10), new Vector(-1, 1, -10), new Vector(1, -1, -10)];

    const litRenderer = new Renderer(4, 200, 200);
    litRenderer.renderFaces(facingLight, [triFace(0, 1, 2)], cam, "#ffffff", [light], 0);
    const { ctx: litCtx, fillTextCalls: lit } = makeFakeCanvas();
    litRenderer.flushPixelBuffer(litCtx as any);

    // Same triangle, but light is now behind it — diffuse contribution clamps to 0.
    const behind = new DirectionalLight(new Vector(0, 0, 1), 1);
    const behindRenderer = new Renderer(4, 200, 200);
    behindRenderer.renderFaces(facingLight, [triFace(0, 1, 2)], cam, "#ffffff", [behind], 0);
    const { ctx: darkCtx, fillTextCalls: dark } = makeFakeCanvas();
    behindRenderer.flushPixelBuffer(darkCtx as any);

    expect(lit.length).toBeGreaterThan(0);
    expect(dark.length).toBeGreaterThan(0);
    // Same triangle, lit version uses a denser glyph than the unlit version.
    const ramp = " .:-=+*#%@";
    const litRank = ramp.indexOf(lit[0].char);
    const darkRank = ramp.indexOf(dark[0].char);
    expect(litRank).toBeGreaterThan(darkRank);
  });

  test("ambient-only with no lights still produces visible glyphs", () => {
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const verts = [new Vector(-1, -1, -5), new Vector(-1, 1, -5), new Vector(1, -1, -5)];

    const r = new Renderer(4, 100, 100);
    r.renderFaces(verts, [triFace(0, 1, 2)], cam, "#ffffff", [], 0.5);
    const { ctx, fillTextCalls } = makeFakeCanvas();
    r.flushPixelBuffer(ctx as any);

    expect(fillTextCalls.length).toBeGreaterThan(0);
    // Ambient 0.5 on a ramp of length 10 → index 5 → '+'
    expect(fillTextCalls[0].char).toBe("+");
  });

  test("color is scaled toward black as brightness decreases", () => {
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const verts = [new Vector(-1, -1, -5), new Vector(-1, 1, -5), new Vector(1, -1, -5)];

    const dim = new Renderer(4, 100, 100);
    dim.renderFaces(verts, [triFace(0, 1, 2)], cam, "#ff0000", [], 0.25);
    const { ctx: ctxDim, fillTextCalls: dimCalls } = makeFakeCanvas();
    dim.flushPixelBuffer(ctxDim as any);

    expect(dimCalls[0].style).toBe("rgb(64, 0, 0)");
  });
});

describe("PointLight integration", () => {
  test("a face close to a point light is brighter than the same face far from it", () => {
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const verts = [new Vector(-1, -1, -5), new Vector(-1, 1, -5), new Vector(1, -1, -5)];

    // Light at the camera, range 100 → distance 5 → atten ≈ 0.9, lambert 1.
    const near = new PointLight(new Vector(0, 0, 0), 1, 100);
    const nearR = new Renderer(4, 200, 200);
    nearR.renderFaces(verts, [triFace(0, 1, 2)], cam, "#ffffff", [near], 0);
    const { ctx: c1, fillTextCalls: nearCalls } = makeFakeCanvas();
    nearR.flushPixelBuffer(c1 as any);

    // Light far behind the camera → distance 95, atten ≈ 0.0025, plus light is on
    // the wrong side anyway so lambert is 0.
    const far = new PointLight(new Vector(0, 0, 90), 1, 100);
    const farR = new Renderer(4, 200, 200);
    farR.renderFaces(verts, [triFace(0, 1, 2)], cam, "#ffffff", [far], 0);
    const { ctx: c2, fillTextCalls: farCalls } = makeFakeCanvas();
    farR.flushPixelBuffer(c2 as any);

    expect(nearCalls.length).toBeGreaterThan(0);
    expect(farCalls.length).toBeGreaterThan(0);
    const ramp = " .:-=+*#%@";
    expect(ramp.indexOf(nearCalls[0].char)).toBeGreaterThan(ramp.indexOf(farCalls[0].char));
  });

  test("a point light beyond its range produces zero diffuse contribution", () => {
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const verts = [new Vector(-1, -1, -5), new Vector(-1, 1, -5), new Vector(1, -1, -5)];

    const outOfRange = new PointLight(new Vector(0, 0, 0), 1, 1);
    const r = new Renderer(4, 200, 200);
    r.renderFaces(verts, [triFace(0, 1, 2)], cam, "#ffffff", [outOfRange], 0);
    const { ctx, fillTextCalls } = makeFakeCanvas();
    r.flushPixelBuffer(ctx as any);

    // Brightness = 0 → ramp[0] = " "
    expect(fillTextCalls.length).toBeGreaterThan(0);
    expect(fillTextCalls[0].char).toBe(" ");
  });
});

describe("SpotLight integration", () => {
  test("a face inside the cone is lit; a face outside the cone is dark", () => {
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    // Spot at origin, axis pointing -Z, narrow 10°/20° cone.
    const spot = new SpotLight(
      new Vector(0, 0, 0),
      new Vector(0, 0, -1),
      1,
      100,
      (10 * Math.PI) / 180,
      (20 * Math.PI) / 180
    );

    // On-axis triangle at z=-5 (well inside the cone).
    const onAxis = [new Vector(-1, -1, -5), new Vector(-1, 1, -5), new Vector(1, -1, -5)];
    const rOn = new Renderer(4, 200, 200);
    rOn.renderFaces(onAxis, [triFace(0, 1, 2)], cam, "#ffffff", [spot], 0);
    const { ctx: cOn, fillTextCalls: onCalls } = makeFakeCanvas();
    rOn.flushPixelBuffer(cOn as any);

    // Off-axis triangle around (5, 0, -5): cone half-angle to centroid is ~45°,
    // well outside the 20° outer cone.
    const offAxis = [new Vector(4, -1, -5), new Vector(4, 1, -5), new Vector(6, -1, -5)];
    const rOff = new Renderer(4, 200, 200);
    rOff.renderFaces(offAxis, [triFace(0, 1, 2)], cam, "#ffffff", [spot], 0);
    const { ctx: cOff, fillTextCalls: offCalls } = makeFakeCanvas();
    rOff.flushPixelBuffer(cOff as any);

    expect(onCalls.length).toBeGreaterThan(0);
    expect(offCalls.length).toBeGreaterThan(0);
    const ramp = " .:-=+*#%@";
    expect(ramp.indexOf(onCalls[0].char)).toBeGreaterThan(ramp.indexOf(offCalls[0].char));
    expect(offCalls[0].char).toBe(" ");
  });

  test("a face at the cone's edge is dimmer than a face on the cone's axis", () => {
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    // Wide cone so both test faces are inside but at different angles from axis.
    const spot = new SpotLight(
      new Vector(0, 0, 0),
      new Vector(0, 0, -1),
      1,
      100,
      (5 * Math.PI) / 180,
      (60 * Math.PI) / 180
    );

    const onAxis = [new Vector(-1, -1, -10), new Vector(-1, 1, -10), new Vector(1, -1, -10)];
    const rOn = new Renderer(4, 200, 200);
    rOn.renderFaces(onAxis, [triFace(0, 1, 2)], cam, "#ffffff", [spot], 0);
    const { ctx: cOn, fillTextCalls: onCalls } = makeFakeCanvas();
    rOn.flushPixelBuffer(cOn as any);

    // Centroid at ~(5, 0, -10): half-angle ≈ atan(5/10) ≈ 26.5° (between inner 5° and outer 60°).
    const edge = [new Vector(4, -1, -10), new Vector(4, 1, -10), new Vector(6, -1, -10)];
    const rEdge = new Renderer(4, 200, 200);
    rEdge.renderFaces(edge, [triFace(0, 1, 2)], cam, "#ffffff", [spot], 0);
    const { ctx: cEdge, fillTextCalls: edgeCalls } = makeFakeCanvas();
    rEdge.flushPixelBuffer(cEdge as any);

    expect(onCalls.length).toBeGreaterThan(0);
    expect(edgeCalls.length).toBeGreaterThan(0);
    const ramp = " .:-=+*#%@";
    expect(ramp.indexOf(onCalls[0].char)).toBeGreaterThan(ramp.indexOf(edgeCalls[0].char));
  });
});
