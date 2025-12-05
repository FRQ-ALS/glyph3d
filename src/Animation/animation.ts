import {
  Keyframes,
  Keyframe,
  AnimationTiming,
  AnimationIterationCount,
  AnimationState,
  AnimatedProperty,
  AnimationType,
} from "./animation.types";
import { Mesh } from "../Mesh";
import { Engine } from "../Engine";

interface AnimationPathFrame {
  property: AnimatedProperty;
  value: number;
  animation: AnimationType;
}

type AnimationPath = {
  timestamp: number;
  frames: Array<AnimationPathFrame>;
};

export class Animation {
  private _startTimeStamp: number = 0;
  private _elapsedTime: number = 0;
  private _path: Array<AnimationPath> = [];
  private _animationComplete: boolean = false;
  constructor(
    private _duration: number,
    private _delay: number,
    private _timing: AnimationTiming,
    private _iteration: AnimationIterationCount,
    private _keyframes: Keyframes
  ) {
    this._createPath();
  }

  // Animations are split into subanimations bwteen each step
  private _createSubAnimation(current: number, next: number) {
    // Duration of each frame in milliseconds, calculated from the difference between consecutive timestamps
    const frameDuration = this._duration / (next - current);
    let currentFrameTimestamp = frameDuration;

    while (currentFrameTimestamp <= (next / 100) * this.duration) {
      const factor = Math.max(currentFrameTimestamp / this.duration, 0);
      const properties = Object.keys(this.keyframes[current]);

      const frames: Array<AnimationPathFrame> = [];

      properties.forEach((prop: string) => {
        const frameMovement = (this.keyframes[next][prop as AnimatedProperty] as number) * factor;
        frames.push({
          property: prop as AnimatedProperty,
          value: frameMovement,
          animation: this._getAnimationType(prop as AnimatedProperty),
        });
      });
      this._createFrame(currentFrameTimestamp, frames);
      currentFrameTimestamp += frameDuration;
    }
  }

  private _createFrame(timeStamp: number, frames: Array<AnimationPathFrame>) {
    const frame = {
      timestamp: timeStamp,
      frames: frames,
    };

    this._path.push(frame);
  }

  private _getAnimationType(property: AnimatedProperty) {
    const dict: Record<AnimationType, Array<AnimatedProperty>> = {
      rotate: ["pitch", "yaw"],
      translate: ["x", "y", "z"],
    };

    for (const key of Object.keys(dict)) {
      if (dict[key as AnimationType].includes(property)) {
        return key as AnimationType;
      }
    }

    throw new Error(`Could not find animation type for property: ${property}`);
  }

  private _createPath() {
    const keys = Object.keys(this._keyframes);
    for (let i = 0; i < keys.length - 1; i++) {
      const next = i + 1;
      this._createSubAnimation(parseInt(keys[i]), parseInt(keys[next]));
    }
  }

  get iteration() {
    return this._iteration;
  }

  get keyframes() {
    return this._keyframes;
  }

  get duration() {
    return this._duration;
  }

  get startTimeStamp() {
    return this._startTimeStamp;
  }
  get path() {
    return this._path;
  }

  get elapsedTime() {
    return this._elapsedTime;
  }
  set startTimeStamp(time: number) {
    this._startTimeStamp = time;
  }

  set elapsedTime(time: number) {
    this._elapsedTime = time;
  }

  get delay() {
    return this._delay;
  }
  get animationComplete() {
    return this._animationComplete;
  }
  set animationComplete(status: boolean) {
    this._animationComplete = status;
  }
}

export class AnimationExecutor {
  static exec(state: AnimationState, engine: Engine) {
    const worldTime = engine.timeElapsed;
    const { animation, mesh } = state;

    if (animation.startTimeStamp === 0) {
      animation.startTimeStamp = worldTime;
    } else {
      animation.elapsedTime = worldTime - animation.startTimeStamp;
    }

    this.animate(animation, mesh);
  }

  static animate(animation: Animation, mesh: Mesh) {
    if (animation.elapsedTime < animation.delay) {
      return;
    }
    let stamp = animation.elapsedTime;

    if (this._shouldRestart(animation)) {
      stamp = animation.elapsedTime % animation.duration;
    }
    const matchedKeyframe = animation.path.find((t: AnimationPath) => t.timestamp >= stamp);

    if (!matchedKeyframe) {
      animation.animationComplete = true;
      return;
    }

    for (const frame of matchedKeyframe.frames) {
      this.handleFrame(frame, mesh);
    }
  }

  static handleFrame(frame: AnimationPathFrame, mesh: Mesh): void {
    switch (frame.animation) {
      case "rotate":
        this.rotate(frame, mesh);
        break;
      case "translate":
        this.translate(frame, mesh);
        break;
    }
  }
  static _shouldRestart(animation: Animation): boolean {
    if (animation.elapsedTime < animation.duration) return false;

    if (typeof animation.iteration == "number") {
      return animation.elapsedTime / animation.duration < animation.iteration;
    }

    return animation.iteration == "infinite";
  }

  static rotate(frame: AnimationPathFrame, mesh: Mesh) {
    mesh[frame.property] = frame.value;
  }

  static translate(frame: AnimationPathFrame, mesh: Mesh) {
    mesh[frame.property] = frame.value;
  }
}
