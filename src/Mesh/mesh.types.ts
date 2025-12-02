export interface Triangle {
  indices: [number, number, number];
}
export interface Face {
  face: number;
  triangles: Array<Triangle>;
}