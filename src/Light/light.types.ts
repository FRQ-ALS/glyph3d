import { Vector } from "../vector";

export type LightType = "point" | "spot" | "directional";

export interface DefaultSettings {
  intensity: number;
  color: string;
  shadows?: {
    hardness: number;
  };
}
export interface SpotSettings extends DefaultSettings {
  position: Vector;
  target: Vector;
}

export interface DirectionalSettings extends DefaultSettings {
  pitch: number;
  yaw: number;
}

export interface PointSettings extends DefaultSettings {
  position: Vector;
}
