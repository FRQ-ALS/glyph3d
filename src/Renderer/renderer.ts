import { Vector } from "../Vector";
import { VectorMath } from "../Spatial/vector";
import { Triangle, Face } from "../Mesh/mesh.types";

export class Renderer {
  private zBuffer: Array<Array<number>> = [];

  constructor(
    private pixelSize: number,
    private clientWidth: number,
    private clientHeight: number
  ) {
    this.initZBuffer();
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

  /**
   * Render all faces of the mesh
   */
  public renderFaces(
    transformedVertices: Array<Vector>,
    faces: Face[],
    ctx: CanvasRenderingContext2D
  ) {
    this.clearZBuffer();

    faces.forEach((face: Face) => {
      this.renderFace(transformedVertices, face, ctx);
    });
  }

  /**
   * Render a single face with all its triangles
   */
  private renderFace(
    transformedVertices: Array<Vector>,
    face: Face,
    ctx: CanvasRenderingContext2D
  ) {
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
    facesWithDepth.forEach(({ face, v0, v1, v2, faceIndex }) => {
      // Backface culling
      if (!this.isFacingCamera(v0, v1, v2)) {
        return;
      }

      // Fill the triangle with character specific to this face
      this.fillTriangle(v0, v1, v2, face.face, ctx);
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
}
