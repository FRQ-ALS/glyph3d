import { Transformer } from "src/transformer";
import { Vector } from "src/vector";
import { fakeCamera, fakeMesh } from "../helpers";

describe("Transformer.toCameraSpace", () => {
  test("vertex at the camera location maps to the origin", () => {
    const t = new Transformer(800, 600);
    const cam = fakeCamera({ location: new Vector(5, 7, 9) });
    const mesh = fakeMesh([new Vector(5, 7, 9)]);

    const [v] = t.toCameraSpace(mesh, cam);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  test("yaw = π flips X and Z signs (camera looks back)", () => {
    const t = new Transformer(800, 600);
    const cam = fakeCamera({ location: new Vector(0, 0, 0), yaw: Math.PI });
    const mesh = fakeMesh([new Vector(1, 0, -1)]);

    const [v] = t.toCameraSpace(mesh, cam);
    expect(v.x).toBeCloseTo(-1);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(1);
  });

  test("camera translation is applied before rotation", () => {
    const t = new Transformer(800, 600);
    const cam = fakeCamera({ location: new Vector(0, 0, -5), yaw: 0 });
    const mesh = fakeMesh([new Vector(0, 0, -10)]);

    const [v] = t.toCameraSpace(mesh, cam);
    expect(v.z).toBeCloseTo(-5);
  });
});
