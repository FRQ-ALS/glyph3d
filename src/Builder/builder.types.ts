import { Vector } from "../vector";

export type PivotOrigin = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export interface DefinedShape {
  position: Vector;
  origin?: PivotOrigin;
}

export interface GenericMeshParams {
  depth: number;
  shape: Array<Vector>;
  origin?: PivotOrigin;
}

export interface CubeMeshParams extends DefinedShape {
  size: number;
}
