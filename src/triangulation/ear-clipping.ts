import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Triangle } from "src/mesh/mesh.types";
import { TriangulationUtils } from "./utils";

export function earcut(vertices: Array<Vector>): Array<Triangle> {
  if (vertices.length < 3) {
    throw new Error("Cannot triangulate polygon with fewer than 3 vertices");
  }

  // Ensure vertices are CCW and create index mapping
  const verts = TriangulationUtils.ensureWinding([...vertices], "CCW");
  const indexMap = new Map<Vector, number>();
  vertices.forEach((v, i) => indexMap.set(v, i));

  const triangles: Array<Triangle> = [];
  const activeIndices = Array.from({ length: verts.length }, (_, i) => i);

  let attempts = 0;
  const maxAttempts = activeIndices.length * 2;

  while (activeIndices.length > 3) {
    if (attempts++ > maxAttempts) {
      console.warn("Earcut failed: polygon may be invalid or self-intersecting");
      break;
    }

    let earFound = false;

    for (let i = 0; i < activeIndices.length; i++) {
      const prevIdx = activeIndices[(i - 1 + activeIndices.length) % activeIndices.length];
      const currIdx = activeIndices[i];
      const nextIdx = activeIndices[(i + 1) % activeIndices.length];

      const vPrev = verts[prevIdx];
      const vCurr = verts[currIdx];
      const vNext = verts[nextIdx];

      // Check if this forms a valid ear
      if (!TriangulationUtils.isConvex(vPrev, vCurr, vNext)) {
        continue;
      }

      // Check if any other vertex is inside this triangle
      const hasInteriorPoint = activeIndices.some((idx) => {
        if (idx === prevIdx || idx === currIdx || idx === nextIdx) {
          return false;
        }
        return TriangulationUtils.containsVertex(vPrev, vCurr, vNext, verts[idx]);
      });

      if (!hasInteriorPoint) {
        // Found a valid ear - create triangle
        triangles.push({
          indices: [indexMap.get(vPrev)!, indexMap.get(vCurr)!, indexMap.get(vNext)!],
        });

        // Remove the ear tip
        activeIndices.splice(i, 1);
        earFound = true;
        attempts = 0;
        break;
      }
    }

    if (!earFound) {
      console.warn("No ear found in current iteration - polygon may be degenerate");
      break;
    }
  }

  // Add the final triangle
  if (activeIndices.length === 3) {
    triangles.push({
      indices: [
        indexMap.get(verts[activeIndices[0]])!,
        indexMap.get(verts[activeIndices[1]])!,
        indexMap.get(verts[activeIndices[2]])!,
      ],
    });
  }

  return triangles;
}
