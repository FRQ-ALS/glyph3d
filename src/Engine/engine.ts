import { Camera } from "src/Camera";
import { Mesh } from "../Mesh";
import { Renderer } from "../Renderer";
import { Transformer } from "../Transformer";

export interface EngineRenderParams {
  pixelDensity: number;
  pixelSize: number;
}

export class Engine {
  public canvas: HTMLCanvasElement;
  private _currentFrameId: number = 0;
  public pixelDensity: number = 8;
  public pixelSize: number = 5;
  public clientHeight: number = 0;
  public clientWidth: number = 0;
  private ctx: CanvasRenderingContext2D | null;
  private renderer: Renderer;
  private transformer: Transformer;

  constructor(canvas: HTMLCanvasElement, params?: EngineRenderParams) {
    this.canvas = canvas;
    this.pixelDensity = params?.pixelDensity ?? this.pixelDensity;
    this.pixelSize = params?.pixelSize ?? this.pixelSize;
    this.clientHeight = canvas.clientHeight;
    this.clientWidth = canvas.clientWidth;
    this.ctx = canvas.getContext("2d");

    this.renderer = new Renderer(this.pixelSize, this.clientWidth, this.clientHeight);
    this.transformer = new Transformer(this.clientWidth, this.clientHeight);
  }

  runRenderLoop(callback: () => void) {
    const loop = () => {
      callback();
      try {
        this._currentFrameId = requestAnimationFrame(loop);
      } catch (error) {
        console.error(error);
      }
    };
    loop();
  }

  public fillBackground(color: string) {
    if (!this.ctx) throw new Error("Canvas context missing");
    this.ctx.fillStyle = color;
    this.ctx.rect(0, 0, this.clientWidth, this.clientHeight);
    this.ctx.fill();
  }

  draw(mesh: Mesh, camera: Camera) {
    const ctx = this.ctx;
    const size = this.pixelSize;
    if (!ctx) return new Error("Canvas context missing");

    ctx.font = `${size}px monospace`;

    const locallyResolved = mesh.resolveMeshRotation();
    const transformedVertices = this.transformer.transformVertices(locallyResolved, camera);

    this.renderer.renderFaces(transformedVertices, mesh.getFaces(), ctx, camera);
  }
}
