import { Camera } from "../camera";
import { Engine } from "../engine";
import { Light } from "../light";
import { Mesh } from "../mesh";
import { getPixelDensity } from "../screen/getPixelDensity";

export class Scene {
  public engine: Engine;
  public meshes: Array<Mesh> = [];
  private activeCamera: Camera | undefined = undefined;
  public lights: Array<Light> = [];

  constructor(engine: Engine) {
    this.engine = engine;
  }

  addMesh(mesh: Mesh) {
    if (this.meshes.some((m: Mesh) => mesh.name === m.name)) {
      throw new Error(`Mesh with name ${mesh.name} already exists`);
    }
    this.meshes.push(mesh);
  }

  render() {
    this.engine.draw(this);
  }

  public getCamera() {
    return this.activeCamera;
  }

  setCamera(camera: Camera) {
    this.activeCamera = camera;
  }

  public getMeshes() {
    return this.meshes;
  }
}
