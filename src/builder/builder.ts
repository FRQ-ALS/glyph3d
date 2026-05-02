import { Mesh } from "../mesh";
import { Scene } from "../scene";
import { Vector } from "../vector";
import { CubeMeshParams, GenericMeshParams, VolumetricShape } from "./builder.types";
import { Facebuilder } from "./face-builder";
import { TemplateBuilder } from "./template-builder";

/**
 * Factory class for creating mesh objects with various geometric shapes.
 * Provides static methods to build complex 3D meshes from simple parameters.
 */
export class MeshBuilder {
  static Extrude(name: string, scene: Scene, geometry: GenericMeshParams): Mesh {
    const { vertices, faces } = Facebuilder.build(geometry);
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
    const { position, size } = params;
    const { x, y, z } = position;

    const face = [
      new Vector(x, y, z),
      new Vector(x + size, y, z),
      new Vector(x + size, y + size, z),
      new Vector(x, y + size, z),
    ];

    const config = { shape: face, depth: size };
    return this.Extrude(name, scene, config);
  }

  static RectangularPyramid(name: string, scene: Scene, shape: VolumetricShape): Mesh {
    const [vectors, faces] = TemplateBuilder.RectangularPyramid(shape);
    return new Mesh(name, vectors, scene, faces);
  }
  static Tetrahedron(name: string, scene: Scene, shape: VolumetricShape): Mesh {
    const [vectors, faces] = TemplateBuilder.Tetrahedron(shape);
    return new Mesh(name, vectors, scene, faces);
  }

  static Octahedron(name: string, scene: Scene, shape: VolumetricShape): Mesh {
    const [vectors, faces] = TemplateBuilder.Octahedron(shape);
    return new Mesh(name, vectors, scene, faces);
  }
}
