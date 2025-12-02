import { Scene } from "../Scene";
import { Vector } from "../Vector";
import { rotateAroundXAxis, rotateAroundYAxis } from "../Spatial";
import { Face } from "./mesh.types";

export class Mesh {
  constructor(
    private readonly name: string,
    private coordinates: Vector[],
    private scene: Scene,
    private faces: Array<Face>,
    private pitch?: number,
    private yaw?: number
  ) {
    scene.meshes?.push(this);
  }

  public getCoordinates() {
    return this.coordinates;
  }

  public setPitch(pitch: number) {
    this.pitch = pitch;
  }

  public setYaw(yaw: number) {
    this.yaw = yaw;
  }

  public getScene() {
    return this.scene;
  }

  public setCoordinates(coords: Vector[]) {
    this.coordinates = coords;
  }

  public getFaces(): Face[] {
    return this.faces;
  }

  public setFaces(faces: Face[]) {
    this.faces = faces;
  }

  public resolveMeshRotation(): Array<Vector> {
    return this.coordinates.map((v: Vector) => {
      const { x1, z1 } = rotateAroundYAxis(v.x, v.z, this.yaw ?? 0);
      const { y2, z2 } = rotateAroundXAxis(v.y, z1, this.pitch ?? 0);

      return new Vector(x1, y2, z2);
    });
  }
}
