import { Transformer } from "src/transformer";
import { Vector } from "src/vector";

describe("Transformer focal length and perspective projection", () => {
  test("focalLength matches width / 2 / tan(fov/2)", () => {
    const width = 800;
    const height = 600;
    const t = new Transformer(width, height);

    const expected = width / 2 / Math.tan(t.fieldOfViewRadians / 2);
    expect(t.focalLength).toBeCloseTo(expected);
    expect(t.fieldOfViewRadians).toBeCloseTo((120 * Math.PI) / 180);
  });

  test("projectToScreen places camera-space origin (0,0,z) at canvas center", () => {
    const t = new Transformer(800, 600);
    const projected = t.projectToScreen(new Vector(0, 0, -10));
    expect(projected.x).toBeCloseTo(400);
    expect(projected.y).toBeCloseTo(300);
    expect(projected.z).toBeCloseTo(-10);
  });

  test("doubling -z halves the on-screen offset from center (perspective foreshortening)", () => {
    const t = new Transformer(800, 600);
    const near = t.projectToScreen(new Vector(1, 1, -1));
    const far = t.projectToScreen(new Vector(1, 1, -2));

    const nearDx = near.x - 400;
    const farDx = far.x - 400;
    const nearDy = 300 - near.y;
    const farDy = 300 - far.y;

    expect(farDx).toBeCloseTo(nearDx / 2);
    expect(farDy).toBeCloseTo(nearDy / 2);
  });

  test("Y axis is flipped to canvas coordinates (positive cartesian Y -> smaller canvas y)", () => {
    const t = new Transformer(800, 600);
    const up = t.projectToScreen(new Vector(0, 5, -10));
    expect(up.y).toBeLessThan(300);
  });
});
