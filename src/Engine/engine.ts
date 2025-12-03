import { Renderer } from "../Renderer";
import { Transformer } from "../Transformer";
import type { Scene } from "../Scene";
import { getPixelDensity } from "../Screen/getPixelDensity";

export interface EngineRenderParams {
  pixelDensity: number;
  pixelSize: number;
}

const DEFAULT_PIXEL_DENSITY = 8;
const DEFAULT_PIXEL_SIZE = 5;
const DEFAULT_BACKGROUND_COLOR = "#282828";
const DEFAULT_DPR = 2;

export class Engine {
  readonly canvas: HTMLCanvasElement;
  readonly pixelDensity: number;
  readonly pixelSize: number;
  readonly clientHeight: number;
  readonly clientWidth: number;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly renderer: Renderer;
  private readonly transformer: Transformer;
  private currentFrameId: number = 0;

  constructor(canvas: HTMLCanvasElement, params?: EngineRenderParams) {
    this.canvas = canvas;
    this.pixelDensity = params?.pixelDensity ?? DEFAULT_PIXEL_DENSITY;
    this.pixelSize = params?.pixelSize ?? DEFAULT_PIXEL_SIZE;
    this.clientHeight = canvas.clientHeight;
    this.clientWidth = canvas.clientWidth;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D rendering context from canvas");
    }
    this.ctx = context;

    this.renderer = new Renderer(this.pixelSize, this.clientWidth, this.clientHeight);
    this.transformer = new Transformer(this.clientWidth, this.clientHeight);

    this.initialize();
  }

  /**
   * Initializes the canvas with proper dimensions and scaling
   */
  private initialize(): void {
    const dpr = getPixelDensity(DEFAULT_DPR);

    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;

    this.ctx.scale(dpr, dpr);
  }

  /**
   * Starts the render loop with the provided callback
   */
  runRenderLoop(callback: () => void): void {
    const loop = (): void => {
      callback();

      try {
        this.currentFrameId = requestAnimationFrame(loop);
      } catch (error) {
        console.error("Error in render loop:", error);
      }
    };

    loop();
  }

  /**
   * Stops the current render loop
   */
  stopRenderLoop(): void {
    if (this.currentFrameId !== 0) {
      cancelAnimationFrame(this.currentFrameId);
      this.currentFrameId = 0;
    }
  }

  /**
   * Fills the canvas background with the specified color
   */
  fillBackground(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.clientWidth, this.clientHeight);
  }

  /**
   * Clears the canvas with the default background color
   */
  clearCanvas(): void {
    this.fillBackground(DEFAULT_BACKGROUND_COLOR);
  }

  /**
   * Renders a scene to the canvas
   */
  draw(scene: Scene): void {
    this.ctx.font = `${this.pixelSize}px monospace`;

    this.clearCanvas();
    this.renderer.clearZBuffer();
    this.renderer.clearPixelBuffer();

    const camera = scene.getCamera();
    if (!camera) {
      console.warn("Cannot render scene: camera is undefined. Please add a camera to the scene.");
      return;
    }

    for (const mesh of scene.getMeshes()) {
      // Takes care of rotation, translation etc
      const transformedVertices = this.transformer.transformVertices(mesh, camera);
      this.renderer.renderFaces(transformedVertices, mesh.faces, camera);
    }

    this.renderer.flushPixelBuffer(this.ctx);
  }

  /**
   * Cleans up resources when the engine is no longer needed
   */
  dispose(): void {
    this.stopRenderLoop();
  }
}
