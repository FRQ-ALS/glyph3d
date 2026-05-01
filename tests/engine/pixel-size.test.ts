import { Engine } from "src/engine";
import { makeFakeCanvas, fakeCamera } from "../helpers";

const newEngine = () => {
  const { canvas } = makeFakeCanvas(800, 600);
  return new Engine(canvas as any);
};

describe("Engine.adjustPixelSizeForCamera", () => {
  test("first call with a finite viewDistance is captured as the reference; pixelSize stays at the base", () => {
    const e: any = newEngine();
    const initial = e.pixelSize;

    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 10 }));

    expect(e.referenceViewDistance).toBe(10);
    expect(e.pixelSize).toBe(initial);
  });

  test("zooming in (smaller viewDistance than reference) increases pixelSize", () => {
    const e: any = newEngine();
    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 10 }));
    const before = e.pixelSize;

    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 5 }));

    expect(e.pixelSize).toBeGreaterThan(before);
  });

  test("zooming out (larger viewDistance than reference) does NOT shrink below the base pixel size", () => {
    const e: any = newEngine();
    const base = e.pixelSize;
    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 10 }));

    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 1000 }));

    expect(e.pixelSize).toBe(base);
  });

  test("pixelSize is clamped to MAX_PIXEL_SIZE on extreme zoom-in", () => {
    const e: any = newEngine();
    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 1000 }));

    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 0.001 }));

    expect(e.pixelSize).toBeLessThanOrEqual(64);
  });

  test("camera with no viewDistance leaves pixelSize and reference untouched", () => {
    const e: any = newEngine();
    const before = e.pixelSize;

    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: null }));

    expect(e.pixelSize).toBe(before);
    expect(e.referenceViewDistance).toBeNull();
  });

  test("non-positive viewDistance is ignored", () => {
    const e: any = newEngine();
    const before = e.pixelSize;

    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: 0 }));
    e.adjustPixelSizeForCamera(fakeCamera({ viewDistance: -5 }));

    expect(e.pixelSize).toBe(before);
    expect(e.referenceViewDistance).toBeNull();
  });
});
