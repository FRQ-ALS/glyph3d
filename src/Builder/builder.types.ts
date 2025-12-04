import { Vector } from "../Vector";

export type CoordinateOrigin = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export interface DefinedShape {
  position: Vector;
  origin?: CoordinateOrigin;
}

export interface GenericMeshParams {
  depth: number;
  shape: Array<Vector>;
  origin?: CoordinateOrigin;
}

export interface CubeMeshParams extends DefinedShape {
  size: number;
}
