import { Scene } from "../scene";
import { Vector } from "../vector";
import { rotateAroundXAxis, rotateAroundYAxis } from "../spatial";
import { Face } from "./mesh.types";
import { Animation } from "../animation";
import { Facebuilder } from "../builder/face-builder";

export class Mesh {
  private _centroid: Vector = new Vector(0, 0, 0);
  private _width: number = 0;
  private _height: number = 0;
  private _depth: number = 0;

  constructor(
    readonly name: string,
    private _vertices: Array<Vector>,
    private _scene: Scene,
    private _faces: Array<Face>,
    private _pitch: number = 0,
    private _yaw: number = 0
  ) {
    this.scene.addMesh(this);
    this.generateMeshDimensions();
  }

  /**
   * Calculates properties of mesh on creation. Calculates pivot, width, height, depth
   */
  private generateMeshDimensions() {
    const { width, height, depth } = Facebuilder.computeDimensions(this.vertices);
    this._width = width;
    this._height = height;
    this._depth = depth;
    this.computeCentroid();
  }

  get vertices() {
    return this._vertices;
  }

  set vertices(vertices: Array<Vector>) {
    this._vertices = vertices;
  }

  set pitch(pitch: number) {
    this._pitch = pitch;
  }

  set yaw(yaw: number) {
    this._yaw = yaw;
  }

  get scene() {
    return this._scene;
  }

  get faces(): Array<Face> {
    return this._faces;
  }

  set faces(faces: Array<Face>) {
    this._faces = faces;
  }
  set x(x: number) {
    this.moveMeshTo("x", x);
  }

  set y(y: number) {
    this.moveMeshTo("y", y);
  }
  set z(z: number) {
    this.moveMeshTo("z", z);
  }

  private moveMeshTo(direction: "x" | "y" | "z", target: number) {
    const dimensions: Record<"x" | "y" | "z", number> = {
      x: this._width,
      y: this._height,
      z: this._depth,
    };

    const min = Math.min(...this._vertices.map((v) => v[direction]));
    const dimension = dimensions[direction];

    const pivotWorld = min + dimension;
    const offset = target - pivotWorld;

    this._vertices.forEach((v) => {
      v[direction] += offset;
    });
  }

  private computeCentroid() {
    this._centroid = this.vertices.reduce(
      (acc, v) => {
        acc.x += v.x;
        acc.y += v.y;
        acc.z += v.z;
        return acc;
      },
      { x: 0, y: 0, z: 0 }
    );
    const n = this.vertices.length;
    this._centroid.x /= n;
    this._centroid.y /= n;
    this._centroid.z /= n;
  }

  public resolveLocalMovement(): Array<Vector> {
    if (!this._centroid) return this.vertices;

    const center = this._centroid;

    return this.vertices.map((v: Vector) => {
      if (!center) return v;

      const relX = v.x - center.x;
      const relY = v.y - center.y;
      const relZ = v.z - center.z;

      const { x1, z1 } = rotateAroundYAxis(relX, relZ, this._yaw ?? 0);
      const { y2, z2 } = rotateAroundXAxis(relY, z1, this._pitch ?? 0);

      return new Vector(x1 + center.x, y2 + center.y, z2 + center.z);
    });
  }

  animate(animation: Animation) {
    this.scene.engine.addAnimation(animation, this);
  }
}
