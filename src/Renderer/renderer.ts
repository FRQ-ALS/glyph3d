import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Triangle, Face } from "../mesh/mesh.types";
import { Camera } from "../camera";
import { Transformer } from "../transformer";
import { Pixel } from "./renderer.types";

export class Renderer {
  private zBuffer: Array<Array<number>> = [];
  private pixelBuffer: Array<Pixel> = [];
  private transformer: Transformer;

  private static readonly NEAR_Z = -0.01;

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

  public setPixelSize(size: number) {
    if (size === this.pixelSize) return;
    this.pixelSize = size;
    this.initZBuffer();
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

  public renderFaces(
    cameraSpaceVertices: Array<Vector>,
    faces: Face[],
    camera: Camera,
    color: string
  ) {
    faces.forEach((face: Face) => {
      this.collectFacePixels(cameraSpaceVertices, face, camera, color);
    });
  }

  private collectFacePixels(
    cameraSpaceVertices: Array<Vector>,
    face: Face,
    camera: Camera,
    color: string
  ) {
    const getVerts = (t: Triangle) => t.indices.map((i) => cameraSpaceVertices[i]);

    for (const t of face.triangles) {
      const [cv0, cv1, cv2] = getVerts(t);

      const clippedTris = this.clipAgainstNearPlane(cv0, cv1, cv2);

      for (const [a, b, c] of clippedTris) {
        const v0 = this.transformer.projectToScreen(a);
        const v1 = this.transformer.projectToScreen(b);
        const v2 = this.transformer.projectToScreen(c);

        if (!this.applyFrustumCulling(v0, v1, v2, camera)) continue;
        if (!this.isFacingCamera(v0, v1, v2)) continue;

        this.collectTrianglePixels(v0, v1, v2, face.face, color);
      }
    }
  }

  private clipAgainstNearPlane(v0: Vector, v1: Vector, v2: Vector): Vector[][] {
    const NEAR = Renderer.NEAR_Z;
    const verts = [v0, v1, v2];
    const inside = verts.map((v) => v.z < NEAR);
    const insideCount = (inside[0] ? 1 : 0) + (inside[1] ? 1 : 0) + (inside[2] ? 1 : 0);

    if (insideCount === 3) return [[v0, v1, v2]];
    if (insideCount === 0) return [];

    const intersect = (vIn: Vector, vOut: Vector): Vector => {
      const t = (NEAR - vIn.z) / (vOut.z - vIn.z);
      return new Vector(
        vIn.x + (vOut.x - vIn.x) * t,
        vIn.y + (vOut.y - vIn.y) * t,
        NEAR
      );
    };

    if (insideCount === 1) {
      const inIdx = inside.findIndex((f) => f);
      const vIn = verts[inIdx];
      const vOut1 = verts[(inIdx + 1) % 3];
      const vOut2 = verts[(inIdx + 2) % 3];
      return [[vIn, intersect(vIn, vOut1), intersect(vIn, vOut2)]];
    }

    const outIdx = inside.findIndex((f) => !f);
    const vOut = verts[outIdx];
    const vIn1 = verts[(outIdx + 1) % 3];
    const vIn2 = verts[(outIdx + 2) % 3];
    const a = intersect(vIn1, vOut);
    const b = intersect(vIn2, vOut);
    return [
      [a, vIn1, vIn2],
      [a, vIn2, b],
    ];
  }

  private isFacingCamera(v0: Vector, v1: Vector, v2: Vector): boolean {
    const edge1x = v1.x - v0.x;
    const edge1y = v1.y - v0.y;

    const edge2x = v2.x - v0.x;
    const edge2y = v2.y - v0.y;

    const crossZ = edge1x * edge2y - edge1y * edge2x;

    return crossZ > 0;
  }

  private collectTrianglePixels(
    v0: Vector,
    v1: Vector,
    v2: Vector,
    faceIndex: number,
    color: string
  ) {
    let vertices = [v0, v1, v2].sort((a, b) => a.y - b.y);
    const [top, mid, bot] = vertices;

    const char = this.getCharForFace(faceIndex);

    this.rasterizeTriangleToBuffer(top, mid, bot, char, color, faceIndex);
  }

  private getCharForFace(faceIndex: number): string {
    const faceChars = ["@", "#", "=", ".", "+", "*"];
    return faceChars[faceIndex] || "?";
  }

  private rasterizeTriangleToBuffer(
    top: Vector,
    mid: Vector,
    bot: Vector,
    char: string,
    color: string,
    faceIndex: number
  ) {
    if (Math.abs(top.y - mid.y) < 0.01) {
      this.fillFlatTopTriangleToBuffer(top, mid, bot, char, color, faceIndex);
    } else if (Math.abs(mid.y - bot.y) < 0.01) {
      this.fillFlatBottomTriangleToBuffer(top, mid, bot, char, color, faceIndex);
    } else {
      const t = (mid.y - top.y) / (bot.y - top.y);
      const splitX = top.x + (bot.x - top.x) * t;
      const splitZ = top.z + (bot.z - top.z) * t;
      const split = new Vector(splitX, mid.y, splitZ);

      this.fillFlatBottomTriangleToBuffer(top, mid, split, char, color, faceIndex);
      this.fillFlatTopTriangleToBuffer(mid, split, bot, char, color, faceIndex);
    }
  }

  private fillFlatBottomTriangleToBuffer(
    top: Vector,
    left: Vector,
    right: Vector,
    char: string,
    color: string,
    faceIndex: number
  ) {
    if (left.x > right.x) [left, right] = [right, left];

    const yStart = Math.max(
      0,
      Math.round(top.y / this.pixelSize) * this.pixelSize
    );
    const yEnd = Math.min(
      this.clientHeight,
      Math.round(left.y / this.pixelSize) * this.pixelSize
    );

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

  private fillFlatTopTriangleToBuffer(
    left: Vector,
    right: Vector,
    bot: Vector,
    char: string,
    color: string,
    faceIndex: number
  ) {
    if (left.x > right.x) [left, right] = [right, left];

    const yStart = Math.max(
      0,
      Math.round(left.y / this.pixelSize) * this.pixelSize
    );
    const yEnd = Math.min(
      this.clientHeight,
      Math.round(bot.y / this.pixelSize) * this.pixelSize
    );

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
    const origXStart = Math.round(xLeft / this.pixelSize) * this.pixelSize;
    const origXEnd = Math.round(xRight / this.pixelSize) * this.pixelSize;
    const xStart = Math.max(0, origXStart);
    const xEnd = Math.min(this.clientWidth, origXEnd);
    const xRange = origXEnd - origXStart;

    for (let x = xStart; x <= xEnd; x += this.pixelSize) {
      const t = xRange === 0 ? 0 : (x - origXStart) / xRange;
      const z = zLeft + (zRight - zLeft) * t;

      const gridX = Math.floor(x / this.pixelSize);
      const gridY = Math.floor(y / this.pixelSize);

      if (
        gridY < 0 ||
        gridY >= this.zBuffer.length ||
        gridX < 0 ||
        gridX >= this.zBuffer[0].length
      ) {
        continue;
      }

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

  private resolveAndRender(ctx: CanvasRenderingContext2D) {
    const Z_EPSILON = VectorMath.EPSILON;

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

    let lastGridX = -1;
    let lastGridY = -1;

    for (const pixel of this.pixelBuffer) {
      if (pixel.gridX === lastGridX && pixel.gridY === lastGridY) {
        continue;
      }

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
