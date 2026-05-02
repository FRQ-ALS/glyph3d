import { Renderer } from "src/renderer";
import { Vector } from "src/vector";
import { fakeCamera, makeFakeCanvas } from "../helpers";
import { Engine } from "src/engine";

const triFace = (i0: number, i1: number, i2: number, faceIdx = 0) => ({
  face: faceIdx,
  triangles: [{ indices: [i0, i1, i2] as [number, number, number] }],
});

describe("Renderer.renderFaces end-to-end", () => {
  test("a visible front-facing triangle in front of the camera produces rendered glyphs", () => {
    const r = new Renderer(4, 200, 200);
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const cameraSpaceVertices = [
      new Vector(0, 0, -10),
      new Vector(0, 5, -10),
      new Vector(5, 0, -10),
    ];

    r.renderFaces(cameraSpaceVertices, [triFace(0, 1, 2)], cam, "red");

    const { ctx, fillTextCalls } = makeFakeCanvas();
    r.flushPixelBuffer(ctx as any);

    expect(fillTextCalls.length).toBeGreaterThan(0);
    expect(fillTextCalls.every((c) => c.style === "red")).toBe(true);
  });

  test("when two front-facing triangles overlap in screen space, the closer one occludes the farther one", () => {
    const r = new Renderer(4, 200, 200);
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });

    const verts = [
      // Far triangle (faceIndex=0 -> '@')
      new Vector(0, 0, -10),
      new Vector(0, 5, -10),
      new Vector(5, 0, -10),
      // Near triangle, same XY, smaller -z -> closer (faceIndex=1 -> '#')
      new Vector(0, 0, -2),
      new Vector(0, 5, -2),
      new Vector(5, 0, -2),
    ];

    r.renderFaces(verts, [triFace(0, 1, 2, 0), triFace(3, 4, 5, 1)], cam, "blue");

    const { ctx, fillTextCalls } = makeFakeCanvas();
    r.flushPixelBuffer(ctx as any);

    expect(fillTextCalls.length).toBeGreaterThan(0);
    expect(fillTextCalls.some((c) => c.char === "#")).toBe(true);
    expect(fillTextCalls.every((c) => c.char !== "@")).toBe(true);
  });

  test("backface (reversed winding) produces zero rendered glyphs", () => {
    const r = new Renderer(4, 200, 200);
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const cameraSpaceVertices = [
      new Vector(0, 0, -10),
      new Vector(5, 0, -10),
      new Vector(0, 5, -10),
    ];

    r.renderFaces(cameraSpaceVertices, [triFace(0, 1, 2)], cam, "red");

    const { ctx, fillTextCalls } = makeFakeCanvas();
    r.flushPixelBuffer(ctx as any);

    expect(fillTextCalls.length).toBe(0);
  });

  test("triangle straddling the near plane gets clipped without OOM, and produces bounded output", () => {
    const r = new Renderer(4, 200, 200);
    const cam = fakeCamera({ location: new Vector(0, 0, 0) });
    const cameraSpaceVertices = [new Vector(-5, -5, -2), new Vector(5, -5, 2), new Vector(0, 5, 2)];

    expect(() => {
      r.renderFaces(cameraSpaceVertices, [triFace(0, 1, 2)], cam, "red");
    }).not.toThrow();

    const cellsInViewport = Math.ceil(200 / 4) * Math.ceil(200 / 4);
    expect((r as any).pixelBuffer.length).toBeLessThanOrEqual(cellsInViewport);
  });
});

describe("Engine.draw integration", () => {
  test("scene with no active camera throws a clear error", () => {
    const { canvas } = makeFakeCanvas(200, 200);
    const engine = new Engine(canvas as any);
    const scene: any = { activeCamera: undefined, meshes: [], backgroundColor: "" };

    expect(() => engine.draw(scene)).toThrow(/no active camera/i);
  });

  test("scene with a camera but no meshes runs the full pipeline without throwing", () => {
    const { canvas } = makeFakeCanvas(200, 200);
    const engine = new Engine(canvas as any);
    const scene: any = {
      activeCamera: fakeCamera({ location: new Vector(0, 0, 0), viewDistance: 10 }),
      meshes: [],
      backgroundColor: "",
    };

    expect(() => engine.draw(scene)).not.toThrow();
  });
});
