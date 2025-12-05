import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Triangle, Face } from "../mesh/mesh.types";
import { Camera } from "../camera";
import { Transformer } from "../transformer";

interface Pixel {
  x: number;
  y: number;
  z: number;
  char: string;
  color: string;
  gridX: number;
  gridY: number;
  faceIndex: number;
}

export class Renderer {
  private zBuffer: Array<Array<number>> = [];
  private pixelBuffer: Array<Pixel> = [];
  private transformer: Transformer;

  constructor(
    private pixelSize: number,
    private clientWidth: number,
    private clientHeight: number
  ) {
    this.initZBuffer();
    this.transformer = new Transformer(clientWidth, clientHeight);
  }

  private initZBuffer() {
    const cols = Math.ceil(this.clientWidth / this.pixelSize);
    const rows = Math.ceil(this.clientHeight / this.pixelSize);
    this.zBuffer = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(Infinity));
  }

  public clearZBuffer() {
    for (let i = 0; i < this.zBuffer.length; i++) {
      for (let j = 0; j < this.zBuffer[i].length; j++) {
        this.zBuffer[i][j] = Infinity;
      }
    }
  }

  public clearPixelBuffer() {
    this.pixelBuffer = [];
  }

  public flushPixelBuffer(ctx: CanvasRenderingContext2D) {
    this.resolveAndRender(ctx);
  }

  public renderFaces(transformedVertices: Array<Vector>, faces: Face[], camera: Camera) {
    // Collect all pixels into buffer (accumulates across multiple renderFaces calls)
    faces.forEach((face: Face) => {
      this.collectFacePixels(transformedVertices, face, camera);
    });
  }

  /**
   * Collect all pixels from a single face into the pixel buffer
   */
  private collectFacePixels(transformedVertices: Array<Vector>, face: Face, camera: Camera) {
    const getVerts = (t: Triangle) => t.indices.map((i) => transformedVertices[i]);

    // Process triangles - collect pixels without rendering
    face.triangles.forEach((t, faceIndex) => {
      const [v0, v1, v2] = getVerts(t);

      // Frustum culling
      if (!this.applyFrustumCulling(v0, v1, v2, camera)) {
        return;
      }

      // Backface culling
      if (!this.isFacingCamera(v0, v1, v2)) {
        return;
      }

      // Collect pixels from this triangle
      this.collectTrianglePixels(v0, v1, v2, face.face);
    });
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
   * Collect pixels from a triangle using scan-line algorithm
   * Each face gets a unique character based on its index
   */
  private collectTrianglePixels(v0: Vector, v1: Vector, v2: Vector, faceIndex: number) {
    // Sort vertices by Y coordinate (top to bottom)
    let vertices = [v0, v1, v2].sort((a, b) => a.y - b.y);
    const [top, mid, bot] = vertices;

    // Get character and color for this specific face
    const char = this.getCharForFace(faceIndex);
    const color = this.getColorForFace(faceIndex);

    // Rasterize triangle using scan-line algorithm
    this.rasterizeTriangleToBuffer(top, mid, bot, char, color, faceIndex);
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
    // OR use different colors per face:
    const faceColors = [
      "#fb4934",
      "#fb4934", // Front - red
      "#b8bb26",
      "#b8bb26", // Back - green
      "#fabd2f",
      "#fabd2f", // Top - yellow
      "#83a598",
      "#83a598", // Bottom - blue
      "#d3869b",
      "#d3869b", // Right - purple
      "#fe8019",
      "#fe8019", // Left - orange
    ];
    return faceColors[faceIndex] || "#fb4934";
  }

  /**
   * Rasterize triangle by scanning horizontal lines and adding to buffer
   */
  private rasterizeTriangleToBuffer(
    top: Vector,
    mid: Vector,
    bot: Vector,
    char: string,
    color: string,
    faceIndex: number
  ) {
    // Handle flat triangles separately
    if (Math.abs(top.y - mid.y) < 0.01) {
      this.fillFlatTopTriangleToBuffer(top, mid, bot, char, color, faceIndex);
    } else if (Math.abs(mid.y - bot.y) < 0.01) {
      this.fillFlatBottomTriangleToBuffer(top, mid, bot, char, color, faceIndex);
    } else {
      // Split into two triangles
      // Find point on the long edge at mid.y
      const t = (mid.y - top.y) / (bot.y - top.y);
      const splitX = top.x + (bot.x - top.x) * t;
      const splitZ = top.z + (bot.z - top.z) * t;
      const split = new Vector(splitX, mid.y, splitZ);

      // Draw top half (flat bottom)
      this.fillFlatBottomTriangleToBuffer(top, mid, split, char, color, faceIndex);
      // Draw bottom half (flat top)
      this.fillFlatTopTriangleToBuffer(mid, split, bot, char, color, faceIndex);
    }
  }

  /**
   * Fill a flat-bottom triangle by adding pixels to buffer
   */
  private fillFlatBottomTriangleToBuffer(
    top: Vector,
    left: Vector,
    right: Vector,
    char: string,
    color: string,
    faceIndex: number
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

      this.collectScanLine(xLeft, xRight, y, zLeft, zRight, char, color, faceIndex);
    }
  }

  /**
   * Fill a flat-top triangle by adding pixels to buffer
   */
  private fillFlatTopTriangleToBuffer(
    left: Vector,
    right: Vector,
    bot: Vector,
    char: string,
    color: string,
    faceIndex: number
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

      this.collectScanLine(xLeft, xRight, y, zLeft, zRight, char, color, faceIndex);
    }
  }

  /**
   * Collect pixels from a horizontal scan line into the buffer
   */
  private collectScanLine(
    xLeft: number,
    xRight: number,
    y: number,
    zLeft: number,
    zRight: number,
    char: string,
    color: string,
    faceIndex: number
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

      // Add to pixel buffer
      this.pixelBuffer.push({
        x,
        y,
        z,
        char,
        color,
        gridX,
        gridY,
        faceIndex,
      });
    }
  }

  /**
   * Resolve depth conflicts and render only the closest pixels
   */
  private resolveAndRender(ctx: CanvasRenderingContext2D) {
    const Z_EPSILON = VectorMath.EPSILON; // Tolerance for z-fighting

    this.pixelBuffer.sort((a, b) => {
      const gridCompare =
        a.gridY * this.zBuffer[0].length + a.gridX - (b.gridY * this.zBuffer[0].length + b.gridX);

      if (gridCompare !== 0) return gridCompare;

      const zDiff = b.z - a.z;
      if (Math.abs(zDiff) > Z_EPSILON) {
        return zDiff;
      }

      return a.faceIndex - b.faceIndex;
    });

    // Render only the closest pixel for each grid position
    let lastGridX = -1;
    let lastGridY = -1;

    for (const pixel of this.pixelBuffer) {
      if (pixel.gridX === lastGridX && pixel.gridY === lastGridY) {
        continue;
      }

      // Render this pixel
      ctx.fillStyle = pixel.color;
      ctx.fillText(pixel.char, pixel.x, pixel.y);

      lastGridX = pixel.gridX;
      lastGridY = pixel.gridY;
    }
  }

  applyFrustumCulling(v1: Vector, v2: Vector, v3: Vector, camera: Camera) {
    const cam = camera.getCurrentLocation();
    if (!cam) return false;

    const verts = [v1, v2, v3];
    if (verts.every((v) => v.z >= 0)) return false;

    const vfov = this.transformer.fieldOfViewRadians;
    const aspect = this.clientWidth / this.clientHeight;

    const tanHalfV = Math.tan(vfov / 2);
    const tanHalfH = tanHalfV * aspect;

    if (verts.every((v) => v.x / -v.z < -tanHalfH)) return false;
    if (verts.every((v) => v.y / -v.z < -tanHalfV)) return false;

    return true;
  }
}
