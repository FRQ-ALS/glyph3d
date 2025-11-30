import { Mesh } from "../Mesh";
import { Scene } from "../Scene";
import { Vector } from "../Vector";
import { CubeMeshParams } from "./builder.types";
import { computeNormalNewells } from "../Spatial/matrices";

/**
 * Factory class for creating mesh objects with various geometric shapes.
 * Provides static methods to build complex 3D meshes from simple parameters.
 */
export class MeshBuilder {
  static Shape(name: string, scene: Scene, config: { shape: Vector[]; depth: number }): Mesh {
    const vertices: Array<Vector> = [...config.shape];
    const normal = computeNormalNewells(config.shape);

    for (let i = 0; i < config.shape.length; i++) {
      const v = config.shape[i];
      const newVec = new Vector(
        v.x + normal.x * config.depth,
        v.y + normal.y * config.depth,
        v.z + normal.z * config.depth
      );
      vertices.push(newVec);
    }

    return new Mesh(name, vertices, scene);
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
      new Vector(x, y, z), // 0: front-bottom-left
      new Vector(x + edgeLength, y, z), // 1: front-bottom-right
      new Vector(x + edgeLength, y + edgeLength, z), // 2: front-top-right
      new Vector(x, y + edgeLength, z), // 3: front-top-left
    ];

    return this.Shape(name, scene, { shape: face, depth: edgeLength });
  }

  /**
   * Creates a pyramid mesh with 5 vertices
   * 4 base vertices + 1 apex
   */
  static Pyramid(name: string, scene: Scene, params: CubeMeshParams): Mesh {
    const { x, y, z, edgeLength } = params;
    const halfLen = edgeLength / 2;

    const vertices: Vector[] = [
      // Base (square on XZ plane)
      new Vector(x - halfLen, y, z - halfLen), // 0: base front-left
      new Vector(x + halfLen, y, z - halfLen), // 1: base front-right
      new Vector(x + halfLen, y, z + halfLen), // 2: base back-right
      new Vector(x - halfLen, y, z + halfLen), // 3: base back-left

      // Apex
      new Vector(x, y + edgeLength, z), // 4: top point
    ];

    const mesh = new Mesh(name, vertices, scene);

    // Manually define pyramid faces
    mesh.setFaces([
      // Base (2 triangles)
      { indices: [0, 1, 2] },
      { indices: [0, 2, 3] },

      // Sides (4 triangles)
      { indices: [0, 4, 1] }, // Front face
      { indices: [1, 4, 2] }, // Right face
      { indices: [2, 4, 3] }, // Back face
      { indices: [3, 4, 0] }, // Left face
    ]);

    return mesh;
  }

  /**
   * Creates a plane mesh with 4 vertices (2 triangular faces)
   */
  static Plane(
    name: string,
    scene: Scene,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number
  ): Mesh {
    const vertices: Vector[] = [
      new Vector(x, y, z), // 0: bottom-left
      new Vector(x + width, y, z), // 1: bottom-right
      new Vector(x + width, y + height, z), // 2: top-right
      new Vector(x, y + height, z), // 3: top-left
    ];

    const mesh = new Mesh(name, vertices, scene);

    mesh.setFaces([{ indices: [0, 1, 2] }, { indices: [0, 2, 3] }]);

    return mesh;
  }
}
