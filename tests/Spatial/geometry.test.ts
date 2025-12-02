import { toCanvasFromCartesian } from "src/Spatial";
import { Vector } from "src/Vector";

describe("normalizeOriginToAnchor", () => {
  const clientWidth = 100,
    clientHeight = 100;

  test("toCanvasFromCartesian", () => {
    const v = new Vector(0, 0, 0);
    expect(toCanvasFromCartesian(v, { clientHeight, clientWidth })).toEqual({
      x: 50,
      y: 50,
      z: 0,
    });
  });

  test("toCanvasFromCartesian", () => {
    const v = new Vector(100, 250, 20);
    expect(toCanvasFromCartesian(v, { clientHeight, clientWidth })).toEqual({
      x: 150,
      y: -200,
      z: 20,
    });
  });
});
