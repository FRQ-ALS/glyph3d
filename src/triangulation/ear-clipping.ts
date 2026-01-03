import { Vector } from "../vector";
import { Triangle } from "src/mesh/mesh.types";
import { TriangulationUtils } from "./utils";

interface VertexNode {
  index: number;
  vertex: Vector;
  isConvex: boolean;
  isEar: boolean;
  isReflex: boolean;
  prev: number;
  next: number;
}

export function earcut(vertices: Array<Vector>): Array<Triangle> {
  if (vertices.length < 3) {
    throw new Error("Cannot triangulate polygon with fewer than 3 vertices");
  }

  // Ensure vertices are CCW
  const verts = TriangulationUtils.ensureWinding([...vertices], "CCW");
  const n = verts.length;

  // Handle triangle case
  if (n === 3) {
    return [{ indices: [0, 1, 2] }];
  }

  // Create doubly linked list structure
  const nodes: VertexNode[] = verts.map((vertex, index) => ({
    index,
    vertex,
    isConvex: false,
    isEar: false,
    isReflex: false,
    prev: (index - 1 + n) % n,
    next: (index + 1) % n,
  }));

  // Classify vertices as convex or reflex
  const reflexVertices = new Set<number>();
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    const vPrev = nodes[node.prev].vertex;
    const vCurr = node.vertex;
    const vNext = nodes[node.next].vertex;

    node.isConvex = TriangulationUtils.isConvex(vPrev, vCurr, vNext);
    node.isReflex = !node.isConvex;

    if (node.isReflex) {
      reflexVertices.add(i);
    }
  }

  // Identify initial ears (only test reflex vertices for containment)
  const ears = new Set<number>();
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    if (node.isConvex) {
      node.isEar = isEar(i, nodes, reflexVertices);
      if (node.isEar) {
        ears.add(i);
      }
    }
  }

  console.log(vertices);
  console.log(ears);

  const triangles: Array<Triangle> = [];
  let remaining = n;

  // Remove ears one by one
  while (remaining > 3 && ears.size > 0) {
    // Get an ear to remove
    const earTip = ears.values().next().value!;
    const node = nodes[earTip];
    const prevIdx = node.prev;
    const nextIdx = node.next;

    // Create triangle
    triangles.push({
      indices: [prevIdx, earTip, nextIdx],
    });

    // Remove ear from lists
    ears.delete(earTip);
    reflexVertices.delete(earTip);

    // Update linked list - connect prev to next
    nodes[prevIdx].next = nextIdx;
    nodes[nextIdx].prev = prevIdx;
    remaining--;

    // Update adjacent vertices
    for (const adjIdx of [prevIdx, nextIdx]) {
      const adjNode = nodes[adjIdx];
      const vPrev = nodes[adjNode.prev].vertex;
      const vCurr = adjNode.vertex;
      const vNext = nodes[adjNode.next].vertex;

      // Recompute convexity
      const wasReflex = adjNode.isReflex;
      adjNode.isConvex = TriangulationUtils.isConvex(vPrev, vCurr, vNext);
      adjNode.isReflex = !adjNode.isConvex;

      // Update reflex list
      if (wasReflex && adjNode.isConvex) {
        reflexVertices.delete(adjIdx);
      } else if (!wasReflex && adjNode.isReflex) {
        reflexVertices.add(adjIdx);
      }

      // Update ear status
      if (adjNode.isConvex) {
        const wasEar = adjNode.isEar;
        adjNode.isEar = isEar(adjIdx, nodes, reflexVertices);

        if (adjNode.isEar && !wasEar) {
          ears.add(adjIdx);
        } else if (!adjNode.isEar && wasEar) {
          ears.delete(adjIdx);
        }
      } else {
        // Reflex vertices can't be ears
        if (adjNode.isEar) {
          adjNode.isEar = false;
          ears.delete(adjIdx);
        }
      }
    }
  }
  // Add final triangle
  if (remaining === 3) {
    let current = Array.from(ears)[0];

    const v0 = current;
    const v1 = nodes[v0].next;
    const v2 = nodes[v1].next;

    triangles.push({
      indices: [v0, v1, v2],
    });
  }

  return triangles;
}

// Test if vertex is an ear by checking only reflex vertices for containment
function isEar(vertexIdx: number, nodes: VertexNode[], reflexVertices: Set<number>): boolean {
  const node = nodes[vertexIdx];
  const vPrev = nodes[node.prev].vertex;
  const vCurr = node.vertex;
  const vNext = nodes[node.next].vertex;

  // Only test reflex vertices for containment (optimization from text)
  for (const reflexIdx of reflexVertices) {
    if (reflexIdx === node.prev || reflexIdx === vertexIdx || reflexIdx === node.next) {
      continue;
    }

    if (TriangulationUtils.containsVertex(vPrev, vCurr, vNext, nodes[reflexIdx].vertex)) {
      return false;
    }
  }

  return true;
}
