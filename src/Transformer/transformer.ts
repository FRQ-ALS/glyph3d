import { Camera } from "src/camera";
import { Vector } from "../vector";
import { Mesh } from "../mesh";
import { rotateAroundXAxis, rotateAroundYAxis } from "../spatial";
import { toCanvasFromCartesian } from "../spatial/geometry";

export class Transformer {
  public fieldOfViewDegrees: number = 120;
  public fieldOfViewRadians: number = 0;
  public focalLength: number = 0;

  constructor(
    private canvasWidth: number,
    private canvasHeight: number
  ) {
    this.fieldOfViewRadians = (this.fieldOfViewDegrees * Math.PI) / 180;
    this.focalLength = this.canvasWidth / 2 / Math.tan(this.fieldOfViewRadians / 2);
  }

  public transformVertices(mesh: Mesh, camera: Camera): Vector[] {
    const cameraSpaceVertices = this.toCameraSpace(mesh, camera);
    return cameraSpaceVertices.map((v) => this.projectToScreen(v));
  }

  public toCameraSpace(mesh: Mesh, camera: Camera): Vector[] {
    const localSpace = mesh.resolveLocalMovement();
    const translated = this.translateToWorldSpace(localSpace, camera);
    return translated.map((v) => this.applyCameraRotation(v, camera));
  }

  public projectToScreen(vertex: Vector): Vector {
    const projected = this.applyPerspectiveProjection(vertex);
    const screen = toCanvasFromCartesian(projected, {
      clientHeight: this.canvasHeight,
      clientWidth: this.canvasWidth,
    });
    return new Vector(screen.x, screen.y, screen.z);
  }

  private translateToWorldSpace(vertices: Vector[], camera: Camera): Vector[] {
    const cameraPosition = camera.getCurrentLocation();
    if (!cameraPosition) return [];

    return vertices.map((vertex: Vector) => this.subtractCameraPosition(vertex, cameraPosition));
  }

  private subtractCameraPosition(vertex: Vector, cameraPosition: Vector): Vector {
    return new Vector(
      vertex.x - cameraPosition.x,
      vertex.y - cameraPosition.y,
      vertex.z - cameraPosition.z
    );
  }

  private applyCameraRotation(vertex: Vector, camera: Camera): Vector {
    const { pitch, yaw } = camera.getRotation();
    const { x1, z1 } = rotateAroundYAxis(vertex.x, vertex.z, -yaw);
    const { y2, z2 } = rotateAroundXAxis(vertex.y, z1, -pitch);
    return new Vector(x1, y2, z2);
  }

  private applyPerspectiveProjection(vertex: Vector): Vector {
    const perspectiveScale = this.focalLength / -vertex.z;
    const projectedX = vertex.x * perspectiveScale;
    const projectedY = vertex.y * perspectiveScale;
    return new Vector(projectedX, projectedY, vertex.z);
  }
}
