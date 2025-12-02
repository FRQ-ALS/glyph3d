import { Camera } from "src/Camera";
import { Vector } from "../Vector";
import { rotateAroundXAxis, rotateAroundYAxis } from "../Spatial";
import { toCanvasFromCartesian } from "../Spatial/geometry";

export class Transformer {
  private FOV: number = 120;
  private FOV_RADIANS: number = 0;
  private FOCAL_LENGTH: number = 0;

  constructor(private clientWidth: number, private clientHeight: number) {
    this.FOV_RADIANS = (this.FOV * Math.PI) / 180;
    this.FOCAL_LENGTH = this.clientWidth / 2 / Math.tan(this.FOV_RADIANS / 2);
  }

  /**
   * Transform all vertices through the full pipeline:
   * WORLD SPACE → CAMERA SPACE → VIEW SPACE → PROJECTION → SCREEN SPACE
   */
  public transformVertices(vertices: Vector[], camera: Camera): Vector[] {
    // 1. Camera translation (WORLD SPACE → CAMERA SPACE)
    const cam = camera.getCurrentLocation();
    if (!cam) return [];

    const cameraSpace = vertices.map((coord: Vector) => {
      return new Vector(coord.x - cam.x, coord.y - cam.y, coord.z - cam.z);
    });

    // 2. Apply view rotation and projection
    const rotated = cameraSpace.map((vector) => this.resolveOrientation(vector, camera));

    // 3. Cast to canvas coordinates
    return rotated.map((v: Vector) =>
      toCanvasFromCartesian(v, { clientHeight: this.clientHeight, clientWidth: this.clientWidth })
    );
  }

  /**
   * CAMERA SPACE → VIEW SPACE → PROJECTION → SCREEN SPACE
   */
  private resolveOrientation(vector: Vector, camera: Camera): Vector {
    const { pitch, yaw } = camera.getRotation();

    // 1. Rotate around Y axis (yaw)
    const { x1, z1 } = rotateAroundYAxis(vector.x, vector.z, -yaw);

    // 2. Rotate around X axis (pitch)
    const { y2, z2 } = rotateAroundXAxis(vector.y, z1, -pitch);

    // 3. Apply perspective projection
    const PERSPECTIVE_SCALE_FACTOR = this.FOCAL_LENGTH / (this.FOCAL_LENGTH - z2);

    const projX = x1 * PERSPECTIVE_SCALE_FACTOR;
    const projY = y2 * PERSPECTIVE_SCALE_FACTOR;

    return new Vector(projX, projY, z2);
  }
}
