import { Vector } from "src/vector";

/**
 * Converts Cartesian coordinates (0,0 at center) into canvas coordinates
 * (0,0 at top-left). The canvas center becomes the origin.
 *
 * @param x - Cartesian x-coordinate
 * @param y - Cartesian y-coordinate
 * @param canvas - Target canvas element
 * @returns The mapped canvas coordinates
 */
export function toCanvasFromCartesian(
  v: Vector,
  client: { clientWidth: number; clientHeight: number }
) {
  const { clientWidth, clientHeight } = client;

  return {
    x: clientWidth / 2 + v.x, // map Cartesian center → canvas center
    y: clientHeight / 2 - v.y, // flip Y (optional, but matches screen coordinates)
    z: v.z,
  };
}
