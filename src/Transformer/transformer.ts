import { Camera } from "src/Camera";
import { Vector } from "../Vector";
import { rotateAroundXAxis, rotateAroundYAxis } from "../Spatial";
import { toCanvasFromCartesian } from "../Spatial/geometry";

export class Transformer {
  private fieldOfViewDegrees: number = 120;
  private fieldOfViewRadians: number = 0;
  private focalLength: number = 0;

  constructor(private canvasWidth: number, private canvasHeight: number) {
    this.fieldOfViewRadians = (this.fieldOfViewDegrees * Math.PI) / 180;
    this.focalLength = this.canvasWidth / 2 / Math.tan(this.fieldOfViewRadians / 2);
  }

  /**
   * Transform all vertices through the full rendering pipeline:
   * WORLD SPACE → CAMERA SPACE → VIEW SPACE → PROJECTION → SCREEN SPACE
   */
  public transformVertices(vertices: Vector[], camera: Camera): Vector[] {
    const cameraSpaceVertices = this.translateToWorldSpace(vertices, camera);
    const viewSpaceVertices = this.applyViewTransformation(cameraSpaceVertices, camera);
    const screenSpaceVertices = this.convertToScreenSpace(viewSpaceVertices);

    return screenSpaceVertices;
  }

  /**
   * Step 1: Translate vertices from world space to camera space
   */
  private translateToWorldSpace(vertices: Vector[], camera: Camera): Vector[] {
    const cameraPosition = camera.getCurrentLocation();
    if (!cameraPosition) return [];

    return vertices.map((vertex: Vector) => this.subtractCameraPosition(vertex, cameraPosition));
  }

  /**
   * Subtract camera position from a vertex to get camera-relative coordinates
   */
  private subtractCameraPosition(vertex: Vector, cameraPosition: Vector): Vector {
    return new Vector(
      vertex.x - cameraPosition.x,
      vertex.y - cameraPosition.y,
      vertex.z - cameraPosition.z
    );
  }

  /**
   * Step 2: Apply camera rotation and perspective projection
   */
  private applyViewTransformation(vertices: Vector[], camera: Camera): Vector[] {
    return vertices.map((vertex) => this.transformToViewSpace(vertex, camera));
  }

  /**
   * Transform a single vertex: rotate by camera orientation and apply perspective
   * CAMERA SPACE → VIEW SPACE → PROJECTION
   */
  private transformToViewSpace(vertex: Vector, camera: Camera): Vector {
    const rotatedVertex = this.applyCameraRotation(vertex, camera);
    const projectedVertex = this.applyPerspectiveProjection(rotatedVertex);

    return projectedVertex;
  }

  /**
   * Rotate vertex based on camera pitch and yaw
   */
  private applyCameraRotation(vertex: Vector, camera: Camera): Vector {
    const { pitch, yaw } = camera.getRotation();

    // Apply yaw rotation (around Y axis)
    const { x1, z1 } = rotateAroundYAxis(vertex.x, vertex.z, -yaw);

    // Apply pitch rotation (around X axis)
    const { y2, z2 } = rotateAroundXAxis(vertex.y, z1, -pitch);

    return new Vector(x1, y2, z2);
  }

  /**
   * Apply perspective projection using focal length
   */
  private applyPerspectiveProjection(vertex: Vector): Vector {
    const perspectiveScale = this.calculatePerspectiveScale(vertex.z);

    const projectedX = vertex.x * perspectiveScale;
    const projectedY = vertex.y * perspectiveScale;

    return new Vector(projectedX, projectedY, vertex.z);
  }

  /**
   * Calculate perspective scale factor based on depth
   */
  private calculatePerspectiveScale(depth: number): number {
    return this.focalLength / (this.focalLength - depth);
  }

  /**
   * Step 3: Convert from view space to screen/canvas coordinates
   */
  private convertToScreenSpace(vertices: Vector[]): Vector[] {
    return vertices.map((vertex: Vector) =>
      toCanvasFromCartesian(vertex, {
        clientHeight: this.canvasHeight,
        clientWidth: this.canvasWidth,
      })
    );
  }
}
