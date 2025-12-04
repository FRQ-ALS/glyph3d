import { Scene } from "../Scene";
import { Vector } from "../Vector";
import { rotateAroundXAxis, rotateAroundYAxis } from "../Spatial";
import { Face } from "./mesh.types";
import { Animation } from "../Animation";

export class Mesh {
  constructor(
    readonly name: string,
    private _vertices: Array<Vector>,
    private _scene: Scene,
    private _faces: Array<Face>,
    private _pitch: number = 0,
    private _yaw: number = 0
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

  set x(x: number) {
    this._vertices.forEach((v) => (v.x = v.x + x));
  }
  set y(y: number) {
    this._vertices.forEach((v) => (v.y = v.y = y));
  }
  set z(z: number) {
    this._vertices.forEach((v) => (v.z = v.z + z));
  }

  public resolveMeshRotation(v: any): Array<Vector> {
    return v.map((v: Vector) => {
      const { x1, z1 } = rotateAroundYAxis(v.x, v.z, this._yaw ?? 0);
      const { y2, z2 } = rotateAroundXAxis(v.y, z1, this._pitch ?? 0);

      return new Vector(x1, y2, z2);
    });
  }

  animate(animation: Animation) {
    this.scene.engine.addAnimation(animation, this);
  }
}
