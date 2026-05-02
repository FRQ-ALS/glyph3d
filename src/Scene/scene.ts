import { Camera } from "../camera";
import { Engine } from "../engine";
import { Light } from "../light";
import { Mesh } from "../mesh";

export class Scene {
  public engine: Engine;
  private _meshes: Array<Mesh> = [];
  private _activeCamera: Camera | undefined = undefined;
  public lights: Array<Light> = [];
  public ambientLight: number = 0.2;
  private _backgroundColor: string = "";

  constructor(engine: Engine) {
    this.engine = engine;
  }

  addMesh(mesh: Mesh) {
    if (this._meshes.some((m: Mesh) => mesh.name === m.name)) {
      throw new Error(`Mesh with name ${mesh.name} already exists`);
    }
    this._meshes.push(mesh);
  }

  render() {
    this.engine.draw(this);
  }

  get activeCamera(): Camera | undefined {
    return this._activeCamera;
  }

  set activeCamera(camera: Camera) {
    this._activeCamera = camera;
  }

  get meshes(): Array<Mesh> {
    return this._meshes;
  }

  get backgroundColor(): string {
    return this._backgroundColor;
  }

  set backgroundColor(colour: string) {
    this._backgroundColor = colour;
  }
}
