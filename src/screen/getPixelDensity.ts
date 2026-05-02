/**
 * Returns the current screen's pixel density.
 *
 * @returns The device pixel ratio, or `null` if unavailable.
 */
export function getPixelDensity(fallback: number = 1): number {
  if (typeof window === "undefined" || typeof window.devicePixelRatio !== "number") {
    return fallback;
  }

  return window.devicePixelRatio;
}
