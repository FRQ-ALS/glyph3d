import { Scene } from "../Scene";
import { Vector } from "../Vector";
import { rotateAroundXAxis, rotateAroundYAxis } from "../Spatial";
import { Face } from "./mesh.types";

export class Mesh {
  constructor(
    readonly name: string,
    private _vertices: Array<Vector>,
    private _scene: Scene,
    private _faces: Array<Face>,
    private _pitch?: number,
    private _yaw?: number
  ) {
    this.scene.addMesh(this);
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

  public resolveMeshRotation(): Array<Vector> {
    return this.vertices.map((v: Vector) => {
      const { x1, z1 } = rotateAroundYAxis(v.x, v.z, this._yaw ?? 0);
      const { y2, z2 } = rotateAroundXAxis(v.y, z1, this._pitch ?? 0);

      return new Vector(x1, y2, z2);
    });
  }
}
