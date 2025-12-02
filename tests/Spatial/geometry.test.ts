import { toCanvasFromCartesian } from "src/Spatial";
import { Vector } from "src/Vector";

describe("normalizeOriginToAnchor", () => {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", {
    configurable: true,
    value: 100,
  });

  Object.defineProperty(canvas, "clientHeight", {
    configurable: true,
    value: 100,
  });

  const { clientWidth, clientHeight } = canvas;

  test("toCanvasFromCartesian", () => {
    console.log(clientHeight, clientWidth);
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
