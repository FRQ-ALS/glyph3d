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
}
