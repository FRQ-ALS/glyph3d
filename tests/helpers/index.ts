import { Vector } from "src/vector";

export function fakeCamera(opts?: {
  location?: Vector;
  pitch?: number;
  yaw?: number;
  viewDistance?: number | null;
}): any {
  const state = {
    location: opts?.location ?? new Vector(0, 0, 0),
    pitch: opts?.pitch ?? 0,
    yaw: opts?.yaw ?? 0,
    viewDistance: opts?.viewDistance ?? null,
  };
  return {
    state,
    getCurrentLocation: () => state.location,
    getRotation: () => ({ pitch: state.pitch, yaw: state.yaw }),
    getViewDistance: () => state.viewDistance,
  };
}

export function fakeMesh(vertices: Vector[]): any {
  return {
    resolveLocalMovement: () => vertices,
  };
}

export function fakeScene(viewDistance: number | null): any {
  return {
    activeCamera: {
      getViewDistance: () => viewDistance,
      getCurrentLocation: () => new Vector(0, 0, 0),
      getRotation: () => ({ pitch: 0, yaw: 0 }),
    },
    meshes: [],
    backgroundColor: "",
  };
}

export function makeFakeCanvas(width = 800, height = 600) {
  const fillTextCalls: Array<{ char: string; x: number; y: number; style: string }> = [];
  const ctx: any = {
    fillStyle: "",
    font: "",
    scale: () => {},
    fillRect: () => {},
    fillText: function (char: string, x: number, y: number) {
      fillTextCalls.push({ char, x, y, style: this.fillStyle });
    },
  };
  const canvas: any = {
    clientWidth: width,
    clientHeight: height,
    width: 0,
    height: 0,
    tabIndex: 0,
    focus: () => {},
    addEventListener: () => {},
    getContext: () => ctx,
  };
  return { canvas, ctx, fillTextCalls };
}
