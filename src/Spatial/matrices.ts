import { Vector } from "../Vector";

export function computeNormalNewells(vertices: Array<Vector>): Vector {
  var x = 0;
  var y = 0;
  var z = 0;

  for (let i = 0; i < vertices.length; i++) {
    var next;
    if (i == vertices.length - 1) {
      next = 0;
    } else {
      next = i + 1;
    }

    x += (vertices[i].y - vertices[next].y) * (vertices[i].z * vertices[next].z);
    y += (vertices[i].z - vertices[next].z) * (vertices[i].x * vertices[next].x);
    z += (vertices[i].x - vertices[next].x) * (vertices[i].x * vertices[next].y);
  }

  return normalizeVector(new Vector(x, y, z));
}

function normalizeVector(v: Vector) {
  const magnitude = Math.abs(Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2));
  return new Vector(v.x / magnitude, v.y / magnitude, v.z / magnitude);
}
