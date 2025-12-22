import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Face, Triangle } from "../mesh/mesh.types";
import { GenericMeshParams } from "./builder.types";
import { earcut } from "../triangulation/ear-clipping";

export namespace Facebuilder {
  /**
   * Builds a 3D mesh by extruding a 2D shape along its normal vector.
   * Creates front face, back face, and connecting side faces.
   */
  export function build(geometry: GenericMeshParams): {
    vertices: Array<Vector>;
    faces: Array<Face>;
  } {
    const { depth, shape } = geometry;

    const normal = VectorMath.computeNormalNewells(shape);
    const vertices = createExtrudedVertices(shape, normal, depth);
    const faces = createFaces(shape, vertices);

    return { vertices, faces };
  }

  /**
   * Creates vertices for both front and back faces by extruding along normal.
   */
  function createExtrudedVertices(
    shape: Array<Vector>,
    normal: Vector,
    depth: number
  ): Array<Vector> {
    const frontVertices = [...shape];
    const backVertices = shape.map((vertex) => extrudeVertex(vertex, normal, depth));

    return [...frontVertices, ...backVertices];
  }

  /**
   * Extrudes a single vertex along the normal vector by the given depth.
   */
  function extrudeVertex(vertex: Vector, normal: Vector, depth: number): Vector {
    return new Vector(
      vertex.x + normal.x * depth,
      vertex.y + normal.y * depth,
      vertex.z + normal.z * depth
    );
  }

  /**
   * Creates all faces (front, back, and sides) for the extruded mesh.
   */
  function createFaces(shape: Array<Vector>, vertices: Array<Vector>): Array<Face> {
    const faces: Array<Face> = [];
    const vertexCount = shape.length;
    const backVertexOffset = vertexCount;

    // Front face
    faces.push(createFrontFace(shape));

    // Back face (reversed winding order)
    faces.push(createBackFace(vertices, backVertexOffset));

    // Side faces (quads as triangle pairs)
    faces.push(...createSideFaces(vertexCount, backVertexOffset));

    return faces;
  }

  /**
   * Creates the front face by triangulating the shape.
   */
  function createFrontFace(shape: Array<Vector>): Face {
    return {
      face: 0,
      triangles: earcut(shape),
    };
  }

  /**
   * Creates the back face with reversed winding order.
   */
  function createBackFace(vertices: Array<Vector>, offset: number): Face {
    const backVertices = vertices.slice(offset);
    const triangles = earcut(backVertices).map((triangle) =>
      offsetAndReverseTriangle(triangle, offset)
    );

    return {
      face: 1,
      triangles,
    };
  }

  /**
   * Offsets triangle indices and reverses winding order for back-facing triangles.
   */
  function offsetAndReverseTriangle(triangle: Triangle, offset: number): Triangle {
    const [a, b, c] = triangle.indices.map((index) => index + offset).reverse();

    return {
      indices: [a, b, c] as [number, number, number],
    };
  }

  /**
   * Creates side faces connecting front and back vertices.
   * Each quad is split into two triangles.
   */
  function createSideFaces(vertexCount: number, backOffset: number): Array<Face> {
    const faces: Array<Face> = [];

    for (let i = 0; i < vertexCount; i++) {
      const nextIndex = (i + 1) % vertexCount;

      const frontCurrent = i;
      const frontNext = nextIndex;
      const backCurrent = i + backOffset;
      const backNext = nextIndex + backOffset;

      const triangles: Array<Triangle> = [
        { indices: [frontCurrent, backCurrent, backNext] },
        { indices: [frontCurrent, backNext, frontNext] },
      ];

      faces.push({
        face: i + 2,
        triangles,
      });
    }

    return faces;
  }

  /**
   * Calculates the bounding box dimensions of a set of vertices.
   */
  export function computeDimensions(vertices: Array<Vector>) {
    const bounds = vertices.reduce(
      (acc, vertex) => ({
        minX: Math.min(acc.minX, vertex.x),
        minY: Math.min(acc.minY, vertex.y),
        minZ: Math.min(acc.minZ, vertex.z),
        maxX: Math.max(acc.maxX, vertex.x),
        maxY: Math.max(acc.maxY, vertex.y),
        maxZ: Math.max(acc.maxZ, vertex.z),
      }),
      {
        minX: Infinity,
        minY: Infinity,
        minZ: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        maxZ: -Infinity,
      }
    );

    return {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      depth: bounds.maxZ - bounds.minZ,
    };
  }
}
