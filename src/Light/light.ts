import { Scene } from "../scene";
import { DefaultSettings, Directionalettings, PointSettings, SpotSettings } from "./light.types";

/**
 * Default light
 */
export class Light<TSettings = DefaultSettings> {
  constructor(
    protected readonly name: string,
    protected scene: Scene,
    protected settings: TSettings
  ) {}
  calculate() {}
}

/**
 * Infinite distance, parralel light rays. E.g. sun
 */
export class DirectionalLight extends Light<Directionalettings> {}

/**
 * Emits light in cone shape at specific location. E.g. flashlight
 */
export class SpotLight extends Light<SpotSettings> {}

/**
 * Emits light in all directions. E.g. bulb
 */
export class PointLight extends Light<PointSettings> {}
