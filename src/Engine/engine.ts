import { Camera } from "src/Camera";
import { Mesh } from "../Mesh";
import { Vector } from "../Vector";
import { rotateAroundXAxis, rotateAroundYAxis } from "../Spatial";
import { toCanvasFromCartesian, normalizeOriginToAnchor } from "../Spatial/geometry";
import { Triangle, Face } from "../Mesh/mesh";
import { VectorMath } from "../Spatial/vector";

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
  private FOV: number = 120;
  private FOV_RADIANS: number = 0;
  private FOCAL_LENGTH: number = 0;
  private ctx: CanvasRenderingContext2D | null;
  private zBuffer: number[][] = [];

  constructor(canvas: HTMLCanvasElement, params?: EngineRenderParams) {
    this.canvas = canvas;
    this.pixelDensity = params?.pixelDensity ?? this.pixelDensity;
    this.pixelSize = params?.pixelSize ?? this.pixelSize;
    this.clientHeight = canvas.clientHeight;
    this.clientWidth = canvas.clientWidth;
    this.ctx = canvas.getContext("2d");
    this.initZBuffer();
    this.FOV_RADIANS = (this.FOV * Math.PI) / 180;
    this.FOCAL_LENGTH = this.clientWidth / 2 / Math.tan(this.FOV_RADIANS / 2);
  }

  private initZBuffer() {
    const cols = Math.ceil(this.clientWidth / this.pixelSize);
    const rows = Math.ceil(this.clientHeight / this.pixelSize);
    this.zBuffer = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(Infinity));
  }

  private clearZBuffer() {
    for (let i = 0; i < this.zBuffer.length; i++) {
      for (let j = 0; j < this.zBuffer[i].length; j++) {
        this.zBuffer[i][j] = Infinity;
      }
    }
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
    this.clearZBuffer();

    // Get faces from mesh
    const faces = mesh.getFaces();
    const vertices = mesh.getCoordinates();

    // Transform all vertices once
    const transformedVertices = this.transformVertices(vertices, camera);

    faces.forEach((face: Face) => {
      this.renderFace(transformedVertices, face, camera, ctx);
    });
  }

  private renderFace = (
    transformedVertices: Array<Vector>,
    face: Face,
    camera: Camera,
    ctx: CanvasRenderingContext2D
  ) => {
    const facesWithDepth = face.triangles.map((triangle: Triangle, faceIndex: number) => {
      const v0 = transformedVertices[triangle.indices[0]];
      const v1 = transformedVertices[triangle.indices[1]];
      const v2 = transformedVertices[triangle.indices[2]];
      const avgDepth = (v0.z + v1.z + v2.z) / 3;
      return { face, v0, v1, v2, avgDepth, faceIndex };
    });
    // Sort back to front (larger z first)
    facesWithDepth.sort((a, b) => b.avgDepth - a.avgDepth);
    // Process each face
    facesWithDepth.forEach(({ face, v0, v1, v2, faceIndex, avgDepth }) => {
      // Backface culling
      if (!this.isFacingCamera(v0, v1, v2) || !this._isPointVisible(v0, v1, v2, camera)) {
        return;
      }
      // Fill the triangle with character specific to this face
      this.fillTriangle(v0, v1, v2, face.face, ctx);
    });
  };

  /**
   * Transform all vertices through the full pipeline
   */
  private transformVertices(vertices: Vector[], camera: Camera): Vector[] {
    // 1. Apply origin centering (LOCAL SPACE)
    // const objectLocal = vertices.map((v: Vector) => {
    //   return normalizeOriginToAnchor(v, "center", {
    //     width: 200,
    //     height: 200,
    //     depth: 200,
    //   });
    // });

    // 2. Camera translation (WORLD SPACE → CAMERA SPACE)
    const cam = camera.getCurrentLocation();
    if (!cam) return [];

    const cameraSpace = vertices.map((coord: Vector) => {
      return new Vector(coord.x - cam.x, coord.y - cam.y, coord.z - cam.z);
    });

    // 3. Apply view rotation and projection
    const rotated = cameraSpace.map((vector) => this._resolveOrientation(vector, camera));

    // 4. Cast to canvas coordinates
    return rotated.map((v: Vector) =>
      toCanvasFromCartesian(v, { clientHeight: this.clientHeight, clientWidth: this.clientWidth })
    );
  }
  // TODO: FIX!!!!
  private _isPointVisible(v1: Vector, v2: Vector, v3: Vector, camera: Camera) {
    const aspect = this.clientWidth / this.clientHeight;
    const avgDepth = (v1.z + v2.z + v3.z) / 3;
    const avgX = (v1.x + v2.x + v3.x) / 3;
    const avgY = (v1.y + v2.y + v3.y) / 3;

    const cam = camera.getCurrentLocation();
    if (!cam) return false;

    const inDepth = avgDepth < cam.z;
    const withinHorizontalFOV =
      Math.abs(avgX) <= avgDepth * Math.tan(this.FOV_RADIANS / 2) * aspect;
    const withinVerticalFOV = Math.abs(avgY) <= avgDepth * Math.tan(this.FOV_RADIANS / 2);

    return true;
  }

  /**
   * Check if a face is facing the camera using cross product
   * In camera space, if the normal's Z component points toward camera (positive), it's a back face
   */
  private isFacingCamera(v0: Vector, v1: Vector, v2: Vector): boolean {
    // Calculate two edge vectors
    const edge1x = v1.x - v0.x;
    const edge1y = v1.y - v0.y;

    const edge2x = v2.x - v0.x;
    const edge2y = v2.y - v0.y;

    // Cross product (we only need Z component for backface test)
    // If Z > 0, the face is counter-clockwise (front-facing in screen space)
    const crossZ = edge1x * edge2y - edge1y * edge2x;

    return crossZ > 0;
  }

  /**
   * Fill a triangle with ASCII characters using scan-line algorithm
   * Each face gets a unique character based on its index
   */
  private fillTriangle(
    v0: Vector,
    v1: Vector,
    v2: Vector,
    faceIndex: number,
    ctx: CanvasRenderingContext2D
  ) {
    // Sort vertices by Y coordinate (top to bottom)
    let vertices = [v0, v1, v2].sort((a, b) => a.y - b.y);
    const [top, mid, bot] = vertices;

    // Get character and color for this specific face
    const char = this.getCharForFace(faceIndex);
    const color = this.getColorForFace(faceIndex);

    // Rasterize triangle using scan-line algorithm
    this.rasterizeTriangle(top, mid, bot, char, color, ctx);
  }

  /**
   * Assign a unique character to each face of the cube
   * Face order: 0-1: front, 2-3: back, 4-5: top, 6-7: bottom, 8-9: right, 10-11: left
   */
  private getCharForFace(faceIndex: number): string {
    const faceChars = ["@", "#", "=", ".", "+", "*"];
    return faceChars[faceIndex] || "?";
  }

  /**
   * Assign a unique color to each face (optional, can keep same color)
   */
  private getColorForFace(faceIndex: number): string {
    // Can use same color for all, or different colors per face
    return "#fb4934"; // Keep consistent red color

    // OR use different colors per face:
    // const faceColors = [
    //   "#fb4934", "#fb4934", // Front - red
    //   "#b8bb26", "#b8bb26", // Back - green
    //   "#fabd2f", "#fabd2f", // Top - yellow
    //   "#83a598", "#83a598", // Bottom - blue
    //   "#d3869b", "#d3869b", // Right - purple
    //   "#fe8019", "#fe8019", // Left - orange
    // ];
    // return faceColors[faceIndex] || "#fb4934";
  }

  /**
   * Rasterize triangle by scanning horizontal lines
   */
  private rasterizeTriangle(
    top: Vector,
    mid: Vector,
    bot: Vector,
    char: string,
    color: string,
    ctx: CanvasRenderingContext2D
  ) {
    // Handle flat triangles separately
    if (Math.abs(top.y - mid.y) < 0.01) {
      this.fillFlatTopTriangle(top, mid, bot, char, color, ctx);
    } else if (Math.abs(mid.y - bot.y) < 0.01) {
      this.fillFlatBottomTriangle(top, mid, bot, char, color, ctx);
    } else {
      // Split into two triangles
      // Find point on the long edge at mid.y
      const t = (mid.y - top.y) / (bot.y - top.y);
      const splitX = top.x + (bot.x - top.x) * t;
      const splitZ = top.z + (bot.z - top.z) * t;
      const split = new Vector(splitX, mid.y, splitZ);

      // Draw top half (flat bottom)
      this.fillFlatBottomTriangle(top, mid, split, char, color, ctx);
      // Draw bottom half (flat top)
      this.fillFlatTopTriangle(mid, split, bot, char, color, ctx);
    }
  }

  /**
   * Fill a flat-bottom triangle
   */
  private fillFlatBottomTriangle(
    top: Vector,
    left: Vector,
    right: Vector,
    char: string,
    color: string,
    ctx: CanvasRenderingContext2D
  ) {
    // Ensure left is actually on the left
    if (left.x > right.x) [left, right] = [right, left];

    const yStart = Math.round(top.y / this.pixelSize) * this.pixelSize;
    const yEnd = Math.round(left.y / this.pixelSize) * this.pixelSize;

    for (let y = yStart; y <= yEnd; y += this.pixelSize) {
      const t = (y - top.y) / (left.y - top.y);
      if (t < 0 || t > 1) continue;

      const xLeft = top.x + (left.x - top.x) * t;
      const xRight = top.x + (right.x - top.x) * t;
      const zLeft = top.z + (left.z - top.z) * t;
      const zRight = top.z + (right.z - top.z) * t;

      this.drawScanLine(xLeft, xRight, y, zLeft, zRight, char, color, ctx);
    }
  }

  /**
   * Fill a flat-top triangle
   */
  private fillFlatTopTriangle(
    left: Vector,
    right: Vector,
    bot: Vector,
    char: string,
    color: string,
    ctx: CanvasRenderingContext2D
  ) {
    // Ensure left is actually on the left
    if (left.x > right.x) [left, right] = [right, left];

    const yStart = Math.round(left.y / this.pixelSize) * this.pixelSize;
    const yEnd = Math.round(bot.y / this.pixelSize) * this.pixelSize;

    for (let y = yStart; y <= yEnd; y += this.pixelSize) {
      const t = (y - left.y) / (bot.y - left.y);
      if (t < 0 || t > 1) continue;

      const xLeft = left.x + (bot.x - left.x) * t;
      const xRight = right.x + (bot.x - right.x) * t;
      const zLeft = left.z + (bot.z - left.z) * t;
      const zRight = right.z + (bot.z - right.z) * t;

      this.drawScanLine(xLeft, xRight, y, zLeft, zRight, char, color, ctx);
    }
  }

  /**
   * Draw a horizontal scan line
   */
  private drawScanLine(
    xLeft: number,
    xRight: number,
    y: number,
    zLeft: number,
    zRight: number,
    char: string,
    color: string,
    ctx: CanvasRenderingContext2D
  ) {
    const xStart = Math.round(xLeft / this.pixelSize) * this.pixelSize;
    const xEnd = Math.round(xRight / this.pixelSize) * this.pixelSize;

    for (let x = xStart; x <= xEnd; x += this.pixelSize) {
      const t = xEnd - xStart === 0 ? 0 : (x - xStart) / (xEnd - xStart);
      const z = zLeft + (zRight - zLeft) * t;

      const gridX = Math.floor(x / this.pixelSize);
      const gridY = Math.floor(y / this.pixelSize);

      // Bounds check
      if (
        gridY < 0 ||
        gridY >= this.zBuffer.length ||
        gridX < 0 ||
        gridX >= this.zBuffer[0].length
      ) {
        continue;
      }

      // Z-buffer test (epsilon offers cheap hack to stop overdrawn shared egdes)
      if (z < this.zBuffer[gridY][gridX] - VectorMath.EPSILON) {
        this.zBuffer[gridY][gridX] = z;
        ctx.fillStyle = color;
        ctx.fillText(char, x, y);
      }
    }
  }

  /**
   * CAMERA SPACE → VIEW SPACE → PROJECTION → SCREEN SPACE
   */
  private _resolveOrientation(vector: Vector, camera: Camera): Vector {
    const { pitch, yaw } = camera.getRotation();

    // 1. Rotate around Y
    const { x1, z1 } = rotateAroundYAxis(vector.x, vector.z, -yaw);
    // 2. Rotate around X
    const { y2, z2 } = rotateAroundXAxis(vector.y, z1, -pitch);

    const PERSPECTIVE_SCALE_FACTOR = this.FOCAL_LENGTH / (this.FOCAL_LENGTH - z2);

    const projX = x1 * PERSPECTIVE_SCALE_FACTOR;
    const projY = y2 * PERSPECTIVE_SCALE_FACTOR;

    return new Vector(projX, projY, z2);
  }
}
