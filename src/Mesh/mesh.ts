import { Scene } from "../Scene";
import { Vector } from "../Vector";

export interface Face {
  indices: [number, number, number]; // Triangle vertex indices
}

export class Mesh {
  private faces: Face[] = [];

  constructor(private readonly name: string, private coordinates: Vector[], private scene: Scene) {
    scene.meshes?.push(this);
    this.generateFaces();
  }

  getCoordinates() {
    return this.coordinates;
  }

  public getScene() {
    return this.scene;
  }

  public setCoordinates(coords: Vector[]) {
    this.coordinates = coords;
    this.generateFaces(); // Regenerate faces when coordinates change
  }

  public getFaces(): Face[] {
    return this.faces;
  }

  /**
   * Generate faces based on mesh type
   * This assumes you're creating a cube - modify for other shapes
   */
  private generateFaces() {
    // Check if this looks like a cube (8 vertices)
    if (this.coordinates.length === 8) {
      this.generateCubeFaces();
    }
    // Add other mesh types here
    else if (this.coordinates.length === 4) {
      this.generateTetrahedronFaces();
    } else {
      // For custom meshes, you might need to pass faces explicitly
      console.warn("Unknown mesh topology, faces not generated automatically");
    }
  }

  /**
   * Generate faces for a cube
   * Assumes vertices are ordered:
   * Essentially tells the engine which one of the vetives in this.coordinates belong on which face
   * Faces undergo Triangulation, so each face in this case is made of two trinagles
   * Each set of indices provide the vertex of respective triangles
   * TODO: Make generate function to triangulate vertives
   */
  private generateCubeFaces() {
    this.faces = [
      // Front face (z = -1)
      { indices: [0, 1, 2] },
      { indices: [0, 2, 3] },

      // Back face (z = 1)
      { indices: [4, 6, 5] },
      { indices: [4, 7, 6] },

      // Top face (y = 1)
      { indices: [3, 2, 6] },
      { indices: [3, 6, 7] },

      // Bottom face (y = -1)
      { indices: [0, 5, 1] },
      { indices: [0, 4, 5] },

      // Right face (x = 1)
      { indices: [1, 5, 6] },
      { indices: [1, 6, 2] },

      // Left face (x = -1)
      { indices: [0, 3, 7] },
      { indices: [0, 7, 4] },
    ];
  }

  /**
   * Generate faces for a tetrahedron (4 vertices)
   */
  private generateTetrahedronFaces() {
    this.faces = [
      { indices: [0, 1, 2] },
      { indices: [0, 2, 3] },
      { indices: [0, 3, 1] },
      { indices: [1, 3, 2] },
    ];
  }

  /**
   * Manually set faces for custom mesh topology
   */
  public setFaces(faces: Face[]) {
    this.faces = faces;
  }
}
