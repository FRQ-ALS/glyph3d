// Around y-axis
export function rotateAroundYAxis(x: number, z: number, yaw: number) {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);

  return { x1, z1 };
}

export function rotateAroundXAxis(y: number, z: number, pitch: number) {
  const y2 = y * Math.cos(pitch) - z * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z * Math.cos(pitch);

  return { y2, z2 };
}
