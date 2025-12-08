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
}
