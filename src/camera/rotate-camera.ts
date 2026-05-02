import { Vector } from "../vector";
import { Camera } from "./camera";
import { Scene } from "../scene";
import { rotateAroundXAxis, rotateAroundYAxis } from "../spatial";

/**
 * Camera that orbits around a target point at a fixed distance.
 * Good for object viewers and 3D inspection tools.
 */
export class RotateCamera extends Camera {
  /**
   * @param name Camera identifier
   * @param scene Parent scene
   * @param pitch Vertical angle in radians (0 to π)
   * @param yaw Horizontal angle in radians
   * @param origin Point to orbit around
   * @param radius Distance from origin
   */
  constructor(
    protected readonly name: string,
    protected readonly scene: Scene,
    protected pitch: number,
    protected yaw: number,
    protected origin: Vector,
    private radius: number
  ) {
    super(name, scene, pitch, yaw, origin);
    this.radius = radius;
    this.yaw = yaw;
    this.pitch = pitch;
    this.calcLocation();
  }

  public getViewDistance(): number {
    return this.radius;
  }

  /**
   * Converts spherical coords (pitch, yaw, radius) to cartesian position.
   * Pitch is clamped slightly to avoid gimbal lock at poles.
   */
  private calcLocation(): void {
    // Start with camera behind target
    const offset = new Vector(0, 0, this.radius);

    // Rotate around X-axis (pitch)
    const { y2: y1, z2: z1 } = rotateAroundXAxis(offset.y, offset.z, this.pitch);
    offset.y = y1;
    offset.z = z1;

    // Rotate around Y-axis (yaw)
    const { x1: x2, z1: z2 } = rotateAroundYAxis(offset.x, offset.z, this.yaw);
    offset.x = x2;
    offset.z = z2;

    // Final position = origin + rotated offset
    this.currentLocation = new Vector(
      this.origin.x + offset.x,
      this.origin.y + offset.y,
      this.origin.z + offset.z
    );
  }

  /**
   * Enables mouse controls: drag to rotate, scroll to zoom.
   */
  public attachControl(canvas: HTMLCanvasElement): void {
    this.focusCanvas(canvas);

    let isDragging = false;
    let lastMousePos = { x: 0, y: 0 };

    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      lastMousePos = { x: e.clientX, y: e.clientY };
      isDragging = true;
    });

    canvas.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Scroll to zoom
    canvas.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();

      // Normalize deltaY across input devices and deltaMode units
      let delta = e.deltaY;

      if (e.deltaMode === 1) {
        delta *= 16; // DOM_DELTA_LINE: ~16px per line
      } else if (e.deltaMode === 2) {
        delta *= 100; // DOM_DELTA_PAGE
      }

      const isMouseWheel = Math.abs(delta) >= 50 && Number.isInteger(delta);
      const scale = isMouseWheel ? 0.3 : 1.0;

      const MAX_STEP = 100;
      const normalized = Math.sign(delta) * Math.min(Math.abs(delta), MAX_STEP) * scale;

      const newRadius = this.radius + normalized;
      if (newRadius < 1) return;

      this.radius = newRadius;
      this.calcLocation();
    });

    // Drag to rotate
    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      if (!isDragging) return;

      const MOVE_SENSITIVITY = 0.003;

      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      this.yaw += dx * MOVE_SENSITIVITY;
      this.pitch += dy * MOVE_SENSITIVITY;

      this.calcLocation();

      lastMousePos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener("mouseout", () => {
      isDragging = false;
    });
  }
}
