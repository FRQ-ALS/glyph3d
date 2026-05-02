import { Animation, AnimationExecutor } from "src/animation";

const fakeAnimMesh = (): any => ({ x: 0, y: 0, z: 0, pitch: 0, yaw: 0 });

describe("Animation path generation", () => {
  test("two keyframes produce a monotonic, linearly interpolated path", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });

    expect(a.path.length).toBe(100);
    expect(a.path[0].timestamp).toBe(10);
    expect(a.path[a.path.length - 1].timestamp).toBe(1000);

    for (let i = 1; i < a.path.length; i++) {
      expect(a.path[i].timestamp).toBeGreaterThan(a.path[i - 1].timestamp);
    }

    expect(a.path[a.path.length - 1].frames[0]).toMatchObject({
      property: "x",
      animation: "translate",
    });
    expect(a.path[a.path.length - 1].frames[0].value).toBeCloseTo(100);
  });

  test("three keyframes hit the exact midpoint value at the midpoint timestamp", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0 },
      50: { x: 50 },
      100: { x: 100 },
    });

    const mid = a.path.find((p) => p.timestamp === 500);
    expect(mid).toBeDefined();
    expect(mid!.frames[0].value).toBeCloseTo(50);

    const end = a.path[a.path.length - 1];
    expect(end.timestamp).toBe(1000);
    expect(end.frames[0].value).toBeCloseTo(100);
  });

  test("multi-segment path has strictly increasing timestamps", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0 },
      25: { x: 10 },
      75: { x: 90 },
      100: { x: 100 },
    });

    for (let i = 1; i < a.path.length; i++) {
      expect(a.path[i].timestamp).toBeGreaterThan(a.path[i - 1].timestamp);
    }
    expect(a.path[a.path.length - 1].timestamp).toBe(1000);
  });

  test("non-monotonic keyframe values are interpolated locally per segment", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0 },
      50: { x: 100 },
      100: { x: 0 },
    });

    expect(a.path.find((p) => p.timestamp === 250)!.frames[0].value).toBeCloseTo(50);
    expect(a.path.find((p) => p.timestamp === 500)!.frames[0].value).toBeCloseTo(100);
    expect(a.path.find((p) => p.timestamp === 750)!.frames[0].value).toBeCloseTo(50);
    expect(a.path[a.path.length - 1].frames[0].value).toBeCloseTo(0);
  });

  test("multiple properties produce one frame entry per property at each timestamp", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0, yaw: 0 },
      100: { x: 100, yaw: 90 },
    });

    const last = a.path[a.path.length - 1];
    const props = last.frames.map((f) => f.property).sort();
    expect(props).toEqual(["x", "yaw"]);

    const xFrame = last.frames.find((f) => f.property === "x")!;
    const yawFrame = last.frames.find((f) => f.property === "yaw")!;
    expect(xFrame.animation).toBe("translate");
    expect(yawFrame.animation).toBe("rotate");
    expect(xFrame.value).toBeCloseTo(100);
    expect(yawFrame.value).toBeCloseTo(90);
  });

  test("missing next-keyframe property falls back to current value (no movement on that property)", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 10, y: 5 },
      100: { x: 50 },
    });

    const last = a.path[a.path.length - 1];
    const yFrame = last.frames.find((f) => f.property === "y")!;
    expect(yFrame.value).toBeCloseTo(5);
  });
});

describe("Animation easing", () => {
  test("linear: midpoint of single segment is the linear midpoint", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    expect(a.path.find((p) => p.timestamp === 250)!.frames[0].value).toBeCloseTo(25);
    expect(a.path.find((p) => p.timestamp === 500)!.frames[0].value).toBeCloseTo(50);
    expect(a.path.find((p) => p.timestamp === 750)!.frames[0].value).toBeCloseTo(75);
  });

  test("ease-in: progress at midpoint is below linear (slow start)", () => {
    const a = new Animation(1000, 0, "ease-in", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    expect(a.path.find((p) => p.timestamp === 500)!.frames[0].value).toBeCloseTo(25);
  });

  test("ease-out: progress at midpoint is above linear (fast start)", () => {
    const a = new Animation(1000, 0, "ease-out", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    expect(a.path.find((p) => p.timestamp === 500)!.frames[0].value).toBeCloseTo(75);
  });

  test("ease-in-out: passes through 50 at midpoint and is symmetric around it", () => {
    const a = new Animation(1000, 0, "ease-in-out", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    expect(a.path.find((p) => p.timestamp === 500)!.frames[0].value).toBeCloseTo(50);
    expect(a.path.find((p) => p.timestamp === 250)!.frames[0].value).toBeCloseTo(12.5);
    expect(a.path.find((p) => p.timestamp === 750)!.frames[0].value).toBeCloseTo(87.5);
  });

  test("ease (default smoothstep): midpoint at 50, monotonic, hits exact endpoint", () => {
    const a = new Animation(1000, 0, "ease", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    expect(a.path.find((p) => p.timestamp === 500)!.frames[0].value).toBeCloseTo(50);
    expect(a.path[a.path.length - 1].frames[0].value).toBeCloseTo(100);

    for (let i = 1; i < a.path.length; i++) {
      expect(a.path[i].frames[0].value).toBeGreaterThanOrEqual(a.path[i - 1].frames[0].value);
    }
  });

  test("every easing reaches the exact end value at the final timestamp", () => {
    const timings = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"] as const;
    for (const t of timings) {
      const a = new Animation(1000, 0, t, 1, {
        0: { x: 0 },
        100: { x: 100 },
      });
      const last = a.path[a.path.length - 1];
      expect(last.timestamp).toBe(1000);
      expect(last.frames[0].value).toBeCloseTo(100);
    }
  });

  test("easing applies per-segment so each segment restarts its eased curve", () => {
    const a = new Animation(1000, 0, "ease-in", 1, {
      0: { x: 0 },
      50: { x: 100 },
      100: { x: 200 },
    });

    expect(a.path.find((p) => p.timestamp === 500)!.frames[0].value).toBeCloseTo(100);
    expect(a.path.find((p) => p.timestamp === 1000)!.frames[0].value).toBeCloseTo(200);

    expect(a.path.find((p) => p.timestamp === 250)!.frames[0].value).toBeCloseTo(25);
    expect(a.path.find((p) => p.timestamp === 750)!.frames[0].value).toBeCloseTo(125);
  });
});

describe("AnimationExecutor.animate", () => {
  test("does nothing while elapsedTime is below delay", () => {
    const a = new Animation(1000, 200, "linear", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    const mesh = fakeAnimMesh();

    a.elapsedTime = 100;
    AnimationExecutor.animate(a, mesh);

    expect(mesh.x).toBe(0);
    expect(a.animationComplete).toBe(false);
  });

  test("applies the path value matching the elapsed time onto the mesh", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    const mesh = fakeAnimMesh();

    a.elapsedTime = 500;
    AnimationExecutor.animate(a, mesh);
    expect(mesh.x).toBeCloseTo(50);
  });

  test("dispatches rotate properties to pitch/yaw and translate properties to x/y/z", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { pitch: 0, yaw: 0, x: 0, y: 0, z: 0 },
      100: { pitch: 30, yaw: 60, x: 1, y: 2, z: 3 },
    });
    const mesh = fakeAnimMesh();

    a.elapsedTime = 1000;
    AnimationExecutor.animate(a, mesh);

    expect(mesh.pitch).toBeCloseTo(30);
    expect(mesh.yaw).toBeCloseTo(60);
    expect(mesh.x).toBeCloseTo(1);
    expect(mesh.y).toBeCloseTo(2);
    expect(mesh.z).toBeCloseTo(3);
  });

  test("marks animation complete when elapsed exceeds duration on a single-iteration animation", () => {
    const a = new Animation(1000, 0, "linear", 1, {
      0: { x: 0 },
      100: { x: 100 },
    });
    const mesh = fakeAnimMesh();

    a.elapsedTime = 1500;
    AnimationExecutor.animate(a, mesh);

    expect(a.animationComplete).toBe(true);
  });

  test("infinite iteration loops the path by elapsed % duration", () => {
    const a = new Animation(1000, 0, "linear", "infinite", {
      0: { x: 0 },
      100: { x: 100 },
    });
    const mesh = fakeAnimMesh();

    a.elapsedTime = 2500;
    AnimationExecutor.animate(a, mesh);

    expect(mesh.x).toBeCloseTo(50);
    expect(a.animationComplete).toBe(false);
  });

  test("numeric iteration count restarts within the loop count and completes after", () => {
    const a = new Animation(1000, 0, "linear", 2, {
      0: { x: 0 },
      100: { x: 100 },
    });
    const mesh = fakeAnimMesh();

    a.elapsedTime = 1500;
    AnimationExecutor.animate(a, mesh);
    expect(mesh.x).toBeCloseTo(50);
    expect(a.animationComplete).toBe(false);

    a.elapsedTime = 2500;
    AnimationExecutor.animate(a, mesh);
    expect(a.animationComplete).toBe(true);
  });
});
