import { Camera } from "../Camera";
import { Engine } from "../Engine";
import { Light } from "../Light";
import { Mesh } from "../Mesh";
import { getPixelDensity } from "../Screen/getPixelDensity";
import { Vector } from "../Vector";

export class Scene {
  public engine: Engine;
  public meshes: Mesh[] = [];
  private activeCamera: Camera | null = null;
  public lights: Light[] = [];
  public ctx?: CanvasRenderingContext2D;

  // Extract out
  public _fontSize: number = 8;
  public _font: string = "monospace";
  private _pixelDensityFallback: number = 1;

  constructor(engine: Engine) {
    this.engine = engine;
    this.initCanvas();
  }

  initCanvas() {
    const canvas = this.engine.canvas;
    if (!canvas) return;

    const dpr = getPixelDensity(this._pixelDensityFallback);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    ctx.scale(dpr, dpr);

    this.ctx = ctx;
  }

  render() {
    if (!this.ctx) return;
    if (!this.activeCamera) return;
    const canvas = this.engine.canvas;
    this.clearCanvas(canvas);

    for (const mesh of this.meshes) {
      this.engine.draw(mesh, this.activeCamera);
    }
  }

  // TODO: BAD! Improve
  clearCanvas(canvas: HTMLCanvasElement) {
    this.engine.fillBackground("#282828");
  }

  public getCamera() {
    return this.activeCamera;
  }

  setCamera(camera: Camera) {
    this.activeCamera = camera;
  }
}
