import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Triangle } from "src/mesh/mesh.types";
import { TriangulationUtils } from "./utils";

export function earcut(vertices: Array<Vector>) {
  // Make deep working copy and ensure vertices are CCW
  const verts: Array<Vector> = TriangulationUtils.ensureWinding([...vertices], "CCW");
  const triangles: Array<Triangle> = [];
  let current = 0;

  while (verts.length > 3) {
    const prev = current === 0 ? verts.length - 1 : current - 1;
    const next = (current + 1) % verts.length;
    let earFound = false;
    const vPrev = verts[prev];
    const vCurr = verts[current];
    const vNext = verts[next];

    // Only convex triangles can be ear cut
    if (TriangulationUtils.isConvex(vPrev, vCurr, vNext)) {
      let contains = false;

      for (let i = 0; i < verts.length; i++) {
        if ([current, prev, next].includes(i)) continue;
        // If triangle contains any other vertex within its area then cannot be ear cut
        if (TriangulationUtils.containsVertex(vPrev, vCurr, vNext, verts[i])) {
          contains = true;
          break;
        }
      }

      if (!contains) {
        triangles.push({
          // Cant use prev, current and next as they relevant to the verts array. So must extract from original Vertices array
          indices: [vertices.indexOf(vPrev), vertices.indexOf(vCurr), vertices.indexOf(vNext)],
        });

        // After we form triangle from point, remove from polygon
        verts.splice(current, 1);
        // After removal, current stays same index
        current = current % verts.length;
        earFound = true;
        continue;
      }
      if (!earFound) {
        console.warn("earcut could not find an ear. Polygon may be invalid or self-intersecting");
        break;
      }
    }

    // move to next vertex
    current = (current + 1) % verts.length;
  }

  // Add remaining three triangles
  triangles.push({
    indices: [vertices.indexOf(verts[0]), vertices.indexOf(verts[1]), vertices.indexOf(verts[2])],
  });

  return triangles;
}
