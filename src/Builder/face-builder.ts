import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Face, Triangle } from "../mesh/mesh.types";
import { GenericMeshParams } from "./builder.types";
import { earcut } from "../triangulation/ear-clipping";
import { Triangulation } from "../triangulation/triangulation";

export namespace Facebuilder {
  export function build(geometry: GenericMeshParams): {
    vertices: Array<Vector>;
    faces: Array<Face>;
  } {
    const { depth, shape, holes } = geometry;
    let vertices: Array<Vector> = [...shape];

    // Use normal to find general direction of shape, then extrude out in the opposite direction
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

    faces.push({ face: 0, triangles: earcut(shape) });

    // Calcaulate back faces, and re-align resulting indexes within context to vertices
    const back = {
      face: 1,
      triangles: earcut(vertices.slice(Math.floor(vertices.length / 2))).map(
        (triangle: Triangle) => {
          const offset = Math.floor(vertices.length / 2);
          const [a, b, c] = triangle.indices.map((index: number) => index + offset).reverse();
          return {
            indices: [a, b, c] as [number, number, number],
          };
        }
      ),
    };

    faces.push(back);

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

  export function computeDimensions(vertices: Array<Vector>) {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    for (const v of vertices) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.z < minZ) minZ = v.z;

      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
      if (v.z > maxZ) maxZ = v.z;
    }

    return {
      width: Math.abs(maxX - minX),
      height: Math.abs(maxY - minY),
      depth: Math.abs(maxZ - minZ),
    };
  }
}
