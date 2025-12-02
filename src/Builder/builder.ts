import { Mesh } from "../Mesh";
import { Scene } from "../Scene";
import { Vector } from "../Vector";
import { CubeMeshParams } from "./builder.types";
import { VectorMath } from "../Spatial/vector";
import { Facebuilder } from "./face-builder";
import { Face, Triangle } from "../Mesh/mesh";

/**
 * Factory class for creating mesh objects with various geometric shapes.
 * Provides static methods to build complex 3D meshes from simple parameters.
 */
export class MeshBuilder {
  static Extrude(name: string, scene: Scene, config: { shape: Vector[]; depth: number }): Mesh {
    const { vertices, faces } = Facebuilder.build(config);
    console.log(faces)
    const mesh = new Mesh(name, vertices, scene, faces);
    return mesh;
  }
  /**
   * Creates a cubic mesh with 8 corner vertices and 12 triangular faces.
   * Much more efficient than the old volumetric approach.
   * The Mesh class automatically generates faces from these 8 vertices.
   *
   * @param name - Unique identifier for the mesh
   * @param scene - Scene object containing the rendering engine and canvas
   * @param params - Parameters defining the cube's position and size
   * @returns A new Mesh instance with 8 vertices that auto-generates 12 triangular faces
   */

  static Cube(name: string, scene: Scene, params: CubeMeshParams): Mesh {
    const { x, y, z, edgeLength } = params;

    const face = [
      new Vector(x, y, z),
      new Vector(x + edgeLength, y, z),
      new Vector(x + edgeLength, y + edgeLength, z),
      new Vector(x, y + edgeLength, z),
    ];

    return this.Extrude(name, scene, { shape: face, depth: edgeLength });
  }

  /**
   * Creates a pyramid mesh with 5 vertices
   * 4 base vertices + 1 apex
   */
  // static Pyramid(name: string, scene: Scene, params: CubeMeshParams): Mesh {
  //   const { x, y, z, edgeLength } = params;
  //   const halfLen = edgeLength / 2;

  //   const vertices: Vector[] = [
  //     // Base (square on XZ plane)
  //     new Vector(x - halfLen, y, z - halfLen), // 0: base front-left
  //     new Vector(x + halfLen, y, z - halfLen), // 1: base front-right
  //     new Vector(x + halfLen, y, z + halfLen), // 2: base back-right
  //     new Vector(x - halfLen, y, z + halfLen), // 3: base back-left

  //     // Apex
  //     new Vector(x, y + edgeLength, z), // 4: top point
  //   ];

  //   // const mesh = new Mesh(name, vertices, scene);

  //   // Manually define pyramid faces
  //   // mesh.setFaces([
  //   //   // Base (2 triangles)
  //   //   { indices: [0, 1, 2] },
  //   //   { indices: [0, 2, 3] },

  //   //   // Sides (4 triangles)
  //   //   { indices: [0, 4, 1] }, // Front face
  //   //   { indices: [1, 4, 2] }, // Right face
  //   //   { indices: [2, 4, 3] }, // Back face
  //   //   { indices: [3, 4, 0] }, // Left face
  //   // ]);

  //   return mesh;
  // }
}
