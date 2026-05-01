import { Renderer } from "src/renderer";

const makeCtx = () => {
  const calls: Array<{ char: string; x: number; y: number; style: string }> = [];
  const ctx: any = {
    fillStyle: "",
    fillText: function (char: string, x: number, y: number) {
      calls.push({ char, x, y, style: this.fillStyle });
    },
  };
  return { ctx, calls };
};

const px = (overrides: Partial<any>) => ({
  x: 0,
  y: 0,
  z: -10,
  char: "#",
  color: "red",
  gridX: 0,
  gridY: 0,
  faceIndex: 0,
  ...overrides,
});

describe("Renderer depth resolution (resolveAndRender)", () => {
  test("at the same grid cell with z-difference > EPSILON, the closer (more negative) z wins", () => {
    const r: any = new Renderer(2, 100, 100);
    r.pixelBuffer.push(px({ z: -5, char: "FAR", color: "far" }));
    r.pixelBuffer.push(px({ z: -1, char: "NEAR", color: "near" }));

    const { ctx, calls } = makeCtx();
    r.flushPixelBuffer(ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0].char).toBe("NEAR");
    expect(calls[0].style).toBe("near");
  });

  test("at the same grid cell with z-difference within EPSILON, smaller faceIndex wins", () => {
    const r: any = new Renderer(2, 100, 100);
    r.pixelBuffer.push(px({ z: -1, faceIndex: 3, char: "B", color: "B" }));
    r.pixelBuffer.push(px({ z: -1 - 1e-9, faceIndex: 1, char: "A", color: "A" }));

    const { ctx, calls } = makeCtx();
    r.flushPixelBuffer(ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0].char).toBe("A");
  });

  test("clearPixelBuffer empties the buffer; clearZBuffer resets cells to Infinity", () => {
    const r: any = new Renderer(2, 4, 4);
    r.pixelBuffer.push(px({}));
    expect(r.pixelBuffer.length).toBe(1);

    r.clearPixelBuffer();
    expect(r.pixelBuffer.length).toBe(0);

    r.zBuffer[0][0] = -42;
    r.clearZBuffer();
    for (const row of r.zBuffer) {
      for (const cell of row) {
        expect(cell).toBe(Infinity);
      }
    }
  });

  test("pixels in different grid cells are all rendered", () => {
    const r: any = new Renderer(2, 100, 100);
    r.pixelBuffer.push(px({ gridX: 0, gridY: 0, char: "A" }));
    r.pixelBuffer.push(px({ gridX: 1, gridY: 0, char: "B" }));
    r.pixelBuffer.push(px({ gridX: 0, gridY: 1, char: "C" }));

    const { ctx, calls } = makeCtx();
    r.flushPixelBuffer(ctx);

    expect(calls.map((c) => c.char).sort()).toEqual(["A", "B", "C"]);
  });
});
