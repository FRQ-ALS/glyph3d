import { Vector } from "../Vector";
import { Camera } from "./camera";
import { Scene } from "../Scene";

// Rotates around a point, has zoom
export class FreeLookCamera extends Camera {
  constructor(
    protected readonly name: string,
    protected readonly scene: Scene,
    protected xRotation: number,
    protected yRotation: number,
    protected origin: Vector,
    private zoom: number
  ) {
    super(name, scene, xRotation, yRotation, origin);
    this.zoom = zoom;
  }
  public setOrigin(vector: Vector): void {}
  public setXRotation(xRotation: number): void {}
  public setYRotation(yRotation: number): void {}

  public attachControl(canvas: HTMLCanvasElement) {
    canvas.tabIndex = 0;
    canvas.focus();

    const MOVE_BY: number = 10;
    var isDragging = false;
    var originalPosition: { x: number; y: number } = { x: 0, y: 0 };

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

    canvas.addEventListener("mousedown", (event) => {
      originalPosition.y = event.clientY;
      originalPosition.x = event.clientX;
      isDragging = true;
    });

    canvas.addEventListener("mouseup", () => {
      isDragging = false;
    });

    canvas.addEventListener("mousemove", (event) => {
      if (isDragging) {
        const yDelta = event.clientY - originalPosition.y;
        const xDelta = event.clientX - originalPosition.x;

        this.yRotation = this.yRotation + (xDelta / 10000) * Math.PI;
        this.xRotation = this.xRotation + (yDelta / 10000) * Math.PI;
      }
    });
  }
}
