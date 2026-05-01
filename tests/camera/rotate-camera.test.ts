import { RotateCamera } from "src/camera/rotate-camera";
import { Vector } from "src/vector";

const fakeScene = (): any => {
  const scene: any = { activeCamera: undefined };
  return scene;
};

describe("RotateCamera spherical coordinate placement", () => {
  test("pitch=0, yaw=0 places camera at (0, 0, radius) from origin", () => {
    const cam = new RotateCamera("c", fakeScene(), 0, 0, new Vector(0, 0, 0), 10);
    const loc = cam.getCurrentLocation()!;
    expect(loc.x).toBeCloseTo(0);
    expect(loc.y).toBeCloseTo(0);
    expect(loc.z).toBeCloseTo(10);
  });

  test("yaw=π/2 swings camera onto +X axis", () => {
    const cam = new RotateCamera("c", fakeScene(), 0, Math.PI / 2, new Vector(0, 0, 0), 10);
    const loc = cam.getCurrentLocation()!;
    expect(loc.x).toBeCloseTo(10);
    expect(loc.y).toBeCloseTo(0);
    expect(loc.z).toBeCloseTo(0);
  });

  test("origin is added to the rotated offset", () => {
    const cam = new RotateCamera("c", fakeScene(), 0, 0, new Vector(1, 2, 3), 5);
    const loc = cam.getCurrentLocation()!;
    expect(loc.x).toBeCloseTo(1);
    expect(loc.y).toBeCloseTo(2);
    expect(loc.z).toBeCloseTo(8);
  });

  test("getViewDistance returns the orbit radius", () => {
    const cam = new RotateCamera("c", fakeScene(), 0, 0, new Vector(0, 0, 0), 42);
    expect(cam.getViewDistance()).toBe(42);
  });

  test("registers itself as scene.activeCamera on construction", () => {
    const scene = fakeScene();
    const cam = new RotateCamera("c", scene, 0, 0, new Vector(0, 0, 0), 1);
    expect(scene.activeCamera).toBe(cam);
  });
});
