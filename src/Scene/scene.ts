import { Camera } from "../Camera";
import { Engine } from "../Engine";
import { Light } from "../Light";
import { Mesh } from "../Mesh";
import { getPixelDensity } from "../Screen/getPixelDensity";

export class Scene {
  public engine: Engine;
  public meshes: Array<Mesh> = [];
  private activeCamera: Camera | undefined = undefined;
  public lights: Array<Light> = [];

  constructor(engine: Engine) {
    this.engine = engine;
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
