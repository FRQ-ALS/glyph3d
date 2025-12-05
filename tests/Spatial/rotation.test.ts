import { rotateAroundXAxis, rotateAroundYAxis } from "src/spatial";

describe("rotateAroundYAxis", () => {
  it("should return original coordinates when yaw is 0", () => {
    const result = rotateAroundYAxis(5, 3, 0);
    expect(result.x1).toBeCloseTo(5);
    expect(result.z1).toBeCloseTo(3);
  });

  it("should rotate 90 degrees (π/2 radians) correctly", () => {
    const result = rotateAroundYAxis(1, 0, Math.PI / 2);
    expect(result.x1).toBeCloseTo(0);
    expect(result.z1).toBeCloseTo(-1);
  });

  it("should rotate 180 degrees (π radians) correctly", () => {
    const result = rotateAroundYAxis(1, 0, Math.PI);
    expect(result.x1).toBeCloseTo(-1);
    expect(result.z1).toBeCloseTo(0);
  });

  it("should rotate 270 degrees (3π/2 radians) correctly", () => {
    const result = rotateAroundYAxis(1, 0, (3 * Math.PI) / 2);
    expect(result.x1).toBeCloseTo(0);
    expect(result.z1).toBeCloseTo(1);
  });

  it("should rotate 360 degrees (2π radians) back to original", () => {
    const result = rotateAroundYAxis(5, 3, 2 * Math.PI);
    expect(result.x1).toBeCloseTo(5);
    expect(result.z1).toBeCloseTo(3);
  });

  it("should handle negative angles", () => {
    const result = rotateAroundYAxis(1, 0, -Math.PI / 2);
    expect(result.x1).toBeCloseTo(0);
    expect(result.z1).toBeCloseTo(1);
  });

  it("should handle negative coordinates", () => {
    const result = rotateAroundYAxis(-3, -4, Math.PI / 4);
    const expected_x = -3 * Math.cos(Math.PI / 4) + -4 * Math.sin(Math.PI / 4);
    const expected_z = -(-3) * Math.sin(Math.PI / 4) + -4 * Math.cos(Math.PI / 4);
    expect(result.x1).toBeCloseTo(expected_x);
    expect(result.z1).toBeCloseTo(expected_z);
  });

  it("should handle zero coordinates", () => {
    const result = rotateAroundYAxis(0, 0, Math.PI / 3);
    expect(result.x1).toBeCloseTo(0);
    expect(result.z1).toBeCloseTo(0);
  });
});

describe("rotateAroundXAxis", () => {
  it("should return original coordinates when pitch is 0", () => {
    const result = rotateAroundXAxis(5, 3, 0);
    expect(result.y2).toBeCloseTo(5);
    expect(result.z2).toBeCloseTo(3);
  });

  it("should rotate 90 degrees (π/2 radians) correctly", () => {
    const result = rotateAroundXAxis(1, 0, Math.PI / 2);
    expect(result.y2).toBeCloseTo(0);
    expect(result.z2).toBeCloseTo(1);
  });

  it("should rotate 180 degrees (π radians) correctly", () => {
    const result = rotateAroundXAxis(1, 0, Math.PI);
    expect(result.y2).toBeCloseTo(-1);
    expect(result.z2).toBeCloseTo(0);
  });

  it("should rotate 270 degrees (3π/2 radians) correctly", () => {
    const result = rotateAroundXAxis(1, 0, (3 * Math.PI) / 2);
    expect(result.y2).toBeCloseTo(0);
    expect(result.z2).toBeCloseTo(-1);
  });

  it("should rotate 360 degrees (2π radians) back to original", () => {
    const result = rotateAroundXAxis(5, 3, 2 * Math.PI);
    expect(result.y2).toBeCloseTo(5);
    expect(result.z2).toBeCloseTo(3);
  });

  it("should handle negative angles", () => {
    const result = rotateAroundXAxis(1, 0, -Math.PI / 2);
    expect(result.y2).toBeCloseTo(0);
    expect(result.z2).toBeCloseTo(-1);
  });

  it("should handle negative coordinates", () => {
    const result = rotateAroundXAxis(-3, -4, Math.PI / 4);
    const expected_y = -3 * Math.cos(Math.PI / 4) - -4 * Math.sin(Math.PI / 4);
    const expected_z = -3 * Math.sin(Math.PI / 4) + -4 * Math.cos(Math.PI / 4);
    expect(result.y2).toBeCloseTo(expected_y);
    expect(result.z2).toBeCloseTo(expected_z);
  });

  it("should handle zero coordinates", () => {
    const result = rotateAroundXAxis(0, 0, Math.PI / 3);
    expect(result.y2).toBeCloseTo(0);
    expect(result.z2).toBeCloseTo(0);
  });
});
