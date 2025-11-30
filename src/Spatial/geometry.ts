import { Vector } from "src/Vector";
import { CoordinateOrigin } from "../Builder/builder.types";

/**
 * Normalizes a coordinate based on a specified anchor/origin of a square shape.
 * Instead of assuming (x, y) is the top-left corner, this allows interpreting it
 * as any common anchor — such as top-left, top-right, bottom-left, bottom-right,
 * or center — and converts it to the true top-left drawing coordinate.
 *
 * Uses a lookup table to apply the appropriate offset, making the behavior
 * easy to extend and avoiding large switch statements.
 *
 * @param x - The reference x-coordinate based on the chosen origin
 * @param y - The reference y-coordinate based on the chosen origin
 * @param origin - The anchor/origin describing how (x, y) should be interpreted
 * @param edgeLength - The side length of the square being positioned
 * @returns The adjusted coordinates representing the actual top-left corner
 */
const ORIGIN_OFFSETS_3D: Record<CoordinateOrigin, [number, number, number]> = {
  "top-left": [0, 0, 0],
  "top-right": [-1, 0, 0],
  "bottom-right": [-1, -1, 0],
  "bottom-left": [0, -1, 0],
  center: [-0.5, -0.5, 0],
};

export function normalizeOriginToAnchor(
  v: Vector,
  origin: CoordinateOrigin,
  size: { width: number; height: number; depth: number }
) {
  const [ox, oy, oz] = ORIGIN_OFFSETS_3D[origin] ?? [0, 0, 0];

  return {
    x: v.x + ox * size.width,
    y: v.y + oy * size.height,
    z: v.z + oz * size.depth,
    faces: v.faces
  };
}

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
    faces: v.faces
  };
}
