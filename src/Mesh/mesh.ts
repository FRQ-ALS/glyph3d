import { Scene } from "../Scene";
import { Vector } from "../Vector";

export interface Triangle {
  indices: [number, number, number];
}
export interface Face {
  face: number;
  triangles: Array<Triangle>;
}

export class Mesh {
  constructor(
    private readonly name: string,
    private coordinates: Vector[],
    private scene: Scene,
    private faces: Array<Face>
  ) {
    scene.meshes?.push(this);
  }

  getCoordinates() {
    return this.coordinates;
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
}
