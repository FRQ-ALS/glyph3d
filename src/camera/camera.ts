import { Vector } from "../vector/vector";
import { Scene } from "../scene/scene";

/**
 * Base camera class - a static viewing portal into the scene.
 * For orbital cameras, use ArcRotateCamera instead.
 */
export class Camera {
  protected currentLocation: Vector;

  /**
   * @param name Camera identifier
   * @param scene Parent scene
   * @param pitch Vertical rotation in radians
   * @param yaw Horizontal rotation in radians
   * @param origin Camera position (for base Camera) or target point (for subclasses)
   */
  constructor(
    protected readonly name: string,
    protected readonly scene: Scene,
    protected pitch: number,
    protected yaw: number,
    protected origin: Vector,
    protected sensitivity?: number
  ) {
    scene.activeCamera = this;
    this.currentLocation = origin;
  }

  public setSensitivity(sensitivity: number) {
    this.sensitivity = sensitivity;
  }

  public getCurrentLocation(): Vector {
    return this.currentLocation;
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getName(): string {
    return this.name;
  }

  public getRotation(): { pitch: number; yaw: number } {
    return {
      pitch: this.pitch,
      yaw: this.yaw,
    };
  }

  public setRotation(pitch: number, yaw: number): void {
    this.pitch = pitch;
    this.yaw = yaw;
  }

  public getOrigin(): Vector {
    return this.origin;
  }

  public getViewDistance(): number | null {
    return null;
  }

  public setOrigin(vector: Vector): void {
    this.origin = vector;
  }

  /**
   * Makes canvas focusable for keyboard events.
   */
  protected focusCanvas(canvas: HTMLCanvasElement): void {
    canvas.tabIndex = 0;
    canvas.focus();
  }
}
