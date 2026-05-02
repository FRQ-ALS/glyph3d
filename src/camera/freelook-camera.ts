import { Vector } from "../vector";
import { Camera } from "./camera";
import { Scene } from "../scene";

// Rotates around a point, has zoom
export class FreeLookCamera extends Camera {
  constructor(
    protected readonly name: string,
    protected readonly scene: Scene,
    protected pitch: number,
    protected yaw: number,
    protected origin: Vector,
    protected sensitivity?: number
  ) {
    super(name, scene, pitch, yaw, origin);
    this.currentLocation = origin;
  }

  public attachControl(canvas: HTMLCanvasElement) {
    this.focusCanvas(canvas);

    const MOVE_BY: number = 10;
    let originalPosition: { x: number; y: number } | undefined = undefined;

    // TODO: Update this to take into account camera rotation
    canvas.addEventListener("keydown", (event) => {
      const curr = this.getOrigin();
      switch (event.key) {
        case "w":
          this.setOrigin(new Vector(curr.x, curr.y, curr.z - MOVE_BY));
          break;
        case "s":
          this.setOrigin(new Vector(curr.x, curr.y, curr.z + MOVE_BY));
          break;
        case "a":
          this.setOrigin(new Vector(curr.x - MOVE_BY, curr.y, curr.z));
          break;
        case "d":
          this.setOrigin(new Vector(curr.x + MOVE_BY, curr.y, curr.z));
          break;
      }
    });

    canvas.addEventListener("mousemove", (event) => {
      const { clientX, clientY } = event;

      if (!originalPosition) {
        const rootPos = {
          x: clientX,
          y: clientY,
        };
        originalPosition = rootPos;
      }

      const x = clientX - originalPosition.x,
        y = clientY - originalPosition.y;
      originalPosition.y = clientY;
      originalPosition.x = clientX;
      this.calculateMouseRotation({ x: x, y: y });
    });
  }

  protected calculateMouseRotation(diff: { x: number; y: number }) {
    // Pitch = rotation about y axis, so need to track change in X
    // Yaw = rotation about x axis, so need to track change in Y
    const { x, y } = diff;
    const pitch = -(y * Math.PI) / 1000;
    const yaw = -(x * Math.PI) / 1000;
    this.pitch += pitch;
    this.yaw += yaw;
  }
}
