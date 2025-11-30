import { Vector } from "../Vector";

export type CoordinateOrigin = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export interface GenericMeshParams {}

export interface MeshParams extends GenericMeshParams {
  shape: Vector[];
  holes?: Vector[];
}

export interface CubeMeshParams extends GenericMeshParams {
  edgeLength: number;
  x: number;
  y: number;
  z: number;

  origin: CoordinateOrigin;
}
export interface CuboidMeshParams extends GenericMeshParams {}
