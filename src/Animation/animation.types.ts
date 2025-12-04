import { Animation } from "./animation";
import { Mesh } from "../Mesh";

export type AnimationType = "rotate" | "translate";

export type AnimatedProperty = ("pitch" | "yaw" | "x" | "y" | "z" | "color") & keyof Mesh;

export type Keyframe = {
  [key in AnimatedProperty]?: number | string;
};

export type Keyframes = {
  [stage: number]: Keyframe;
};
export type AnimationIterationCount = number | "infinite";

/**
 * ease: starts slow, speeds up, then slows down (default).
 * ease-in: starts slow, then speeds up.
 * ease-out: starts fast, then slows down.
 * ease-in-out: starts and ends slow, fast in the middle.
 */
export type AnimationTiming = "ease" | "ease-in" | "ease-out" | "ease-in-out";

export interface AnimationState {
  animation: Animation;
  mesh: Mesh;
  currentIteration?: number;
  timeElapsd: number;
}
