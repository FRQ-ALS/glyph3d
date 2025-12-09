import { Vector } from "../vector";
import { VolumetricShape } from "./builder.types";
import { Face } from "../mesh/mesh.types";

export namespace TemplateBuilder {
  export function RectangularPyramid(shape: VolumetricShape): [Vector[], Face[]] {
    const { position: p, height, depth, width } = shape;

    const v0 = p;
    const v1 = new Vector(p.x + width, p.y, p.z);
    const v2 = new Vector(p.x + width, p.y, p.z + depth);
    const v3 = new Vector(p.x, p.y, p.z + depth);

    // Apex
    const v4 = new Vector(p.x + width / 2, p.y + height, p.z + depth / 2);

    const vertices = [v0, v1, v2, v3, v4];

    const faces: Face[] = [
      {
        face: 0,
        triangles: [{ indices: [0, 1, 3] }, { indices: [1, 2, 3] }],
      },
      { face: 1, triangles: [{ indices: [0, 1, 4] }] },
      { face: 2, triangles: [{ indices: [1, 2, 4] }] },
      { face: 3, triangles: [{ indices: [2, 3, 4] }] },
      { face: 4, triangles: [{ indices: [3, 0, 4] }] },
    ];

    return [vertices, faces];
  }

  export function Tetrahedron(shape: VolumetricShape): [Vector[], Face[]] {
    const { position: p, width } = shape;
    const a = width;

    // Regular tetrahedron coordinates
    const v0 = p;
    const v1 = new Vector(p.x + a, p.y, p.z);
    const v2 = new Vector(p.x + a / 2, p.y, p.z + (Math.sqrt(3) * a) / 2);
    const v3 = new Vector(p.x + a / 2, p.y + (Math.sqrt(6) * a) / 3, p.z + (Math.sqrt(3) * a) / 6);

    const vertices = [v0, v1, v2, v3];

    const faces: Face[] = [
      { face: 0, triangles: [{ indices: [0, 1, 2] }] },
      { face: 1, triangles: [{ indices: [0, 1, 3] }] },
      { face: 2, triangles: [{ indices: [1, 2, 3] }] },
      { face: 3, triangles: [{ indices: [2, 0, 3] }] },
    ];

    return [vertices, faces];
  }

  export function Octahedron(shape: VolumetricShape): [Vector[], Face[]] {
    const { position: p, width, height } = shape;

    const r = width / 2;
    const h = height / 2;

    const v0 = new Vector(p.x, p.y + h, p.z);
    const v1 = new Vector(p.x, p.y - h, p.z);
    const v2 = new Vector(p.x + r, p.y, p.z);
    const v3 = new Vector(p.x - r, p.y, p.z);
    const v4 = new Vector(p.x, p.y, p.z + r);
    const v5 = new Vector(p.x, p.y, p.z - r);

    const vertices = [v0, v1, v2, v3, v4, v5];

    const faces: Face[] = [
      { face: 0, triangles: [{ indices: [0, 2, 4] }] },
      { face: 1, triangles: [{ indices: [0, 4, 3] }] },
      { face: 2, triangles: [{ indices: [0, 3, 5] }] },
      { face: 3, triangles: [{ indices: [0, 5, 2] }] },

      { face: 4, triangles: [{ indices: [1, 4, 2] }] },
      { face: 5, triangles: [{ indices: [1, 3, 4] }] },
      { face: 6, triangles: [{ indices: [1, 5, 3] }] },
      { face: 7, triangles: [{ indices: [1, 2, 5] }] },
    ];

    return [vertices, faces];
  }
}
