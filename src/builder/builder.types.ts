import { Vector } from "../vector";

export type PivotOrigin = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export interface DefinedShape {
  position: Vector;
}

export interface GenericMeshParams {
  depth: number;
  shape: Array<Vector>;
  origin?: PivotOrigin;
  holes?: Array<Array<Vector>>;
}

export interface CubeMeshParams extends DefinedShape {
  size: number;
}

export interface VolumetricShape extends DefinedShape {
  height: number; // y axis
  width: number; // x axis
  depth: number; // z axis
}
