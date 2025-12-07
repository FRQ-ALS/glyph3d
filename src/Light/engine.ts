import { Light } from "./light";

// Controls brightness per pixel
// Diffusion
// Specular lighting (shininess)
// Distance attenuation. Light should get dimmer with distance
// Add ambient lighting so avoid some pixels becoming pure black, essentially have a minmum light that is applied
export class LightEngine {
  calculate(light: Light, pixel: any) {}
}

