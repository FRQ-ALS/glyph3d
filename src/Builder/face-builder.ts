import { Vector } from "../Vector";
import { VectorMath } from "../Spatial/vector";
import { Face, Triangle } from "../Mesh/mesh";

export namespace Facebuilder {
  export function build(config: { shape: Vector[]; depth: number }): {
    vertices: Array<Vector>;
    faces: Array<Face>;
  } {
    const { depth, shape } = config;
    const vertices: Array<Vector> = [...shape];
    const normal = VectorMath.computeNormalNewells(shape);

    // Create back face by extruding along normal
    for (let i = 0; i < shape.length; i++) {
      const v = shape[i];
      const newVec = new Vector(
        v.x + normal.x * depth,
        v.y + normal.y * depth,
        v.z + normal.z * depth
      );
      vertices.push(newVec);
    }

    const n = shape.length;
    const faces: Face[] = [];

    // 1. FRONT FACE - Triangulate using fan triangulation from first vertex
    const frontFace: Array<Triangle> = [];
    for (let i = 1; i < n - 1; i++) {
      frontFace.push({ indices: [0, i, i + 1] });
    }
    faces.push({ face: 0, triangles: frontFace });

    // 2. BACK FACE - Triangulate (reversed winding for correct normals)
    const backFace: Array<Triangle> = [];
    for (let i = 1; i < n - 1; i++) {
      backFace.push({ indices: [n, n + i + 1, n + i] });
    }

    faces.push({ face: 1, triangles: backFace });
    let sideFace: Array<Triangle> = [];
    // 3. SIDE FACES - Create quads as 2 triangles each
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const frontCurrent = i;
      const frontNext = next;
      const backCurrent = i + n;
      const backNext = next + n;

      sideFace.push({ indices: [frontCurrent, backCurrent, backNext] });
      sideFace.push({ indices: [frontCurrent, backNext, frontNext] });
      faces.push({ face: i + 2, triangles: sideFace });
      sideFace = [];
    }

    return { vertices, faces };
  }
}
