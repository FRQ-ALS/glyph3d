import { Vector } from "../vector";
import { VectorMath } from "../spatial/vector";
import { Camera } from "../camera";
import { Transformer } from "../transformer";

/**
 * A light that's already been transformed into camera space and knows how to
 * report how much it lights up a given point + normal.
 */
export interface ViewLight {
  contributionAt(point: Vector, normal: Vector): number;
}

/**
 * Anything that lights the scene. Subclasses pick the geometry (parallel rays,
 * point, cone) and the falloff curve. `toViewSpace` runs once per frame to
 * bake the light into camera space so per-face shading stays cheap.
 */
export abstract class Light {
  constructor(public intensity: number) {}
  abstract toViewSpace(transformer: Transformer, camera: Camera): ViewLight;
}

/**
 * Sun-style light: infinitely far away, perfectly parallel rays. `direction`
 * is the way the light *travels*, so a sun overhead is (0, -1, 0).
 */
export class DirectionalLight extends Light {
  constructor(
    public direction: Vector,
    intensity: number = 1
  ) {
    super(intensity);
  }

  toViewSpace(transformer: Transformer, camera: Camera): ViewLight {
    const dir = VectorMath.normalize(transformer.directionToCameraSpace(this.direction, camera));
    return new DirectionalViewLight(dir, this.intensity);
  }
}

class DirectionalViewLight implements ViewLight {
  constructor(
    private direction: Vector,
    private intensity: number
  ) {}
  contributionAt(_point: Vector, normal: Vector): number {
    // Lambert's cosine law. dot(N, L) is cos(angle) for unit vectors;
    // clamp negatives so a back-facing surface contributes nothing instead
    // of going negative.
    return Math.max(0, VectorMath.dot(normal, this.direction)) * this.intensity;
  }
}

/**
 * Bare-bulb light: shines in every direction from a point, dimming smoothly
 * out to `range` and going dark beyond it.
 */
export class PointLight extends Light {
  constructor(
    public position: Vector,
    intensity: number = 1,
    public range: number = 100
  ) {
    super(intensity);
  }

  toViewSpace(transformer: Transformer, camera: Camera): ViewLight {
    const pos = transformer.pointToCameraSpace(this.position, camera);
    return new PointViewLight(pos, this.intensity, this.range);
  }
}

class PointViewLight implements ViewLight {
  constructor(
    private position: Vector,
    private intensity: number,
    private range: number
  ) {}
  contributionAt(point: Vector, normal: Vector): number {
    // Direction the light travels to reach this surface, plus its length.
    const toPoint = VectorMath.subtract(point, this.position);
    const d = VectorMath.magnitude(toPoint);
    if (d >= this.range || d < VectorMath.EPSILON) return 0;
    const lightDir = new Vector(toPoint.x / d, toPoint.y / d, toPoint.z / d);

    // Lambert's cosine law: how directly the surface faces the ray.
    const lambert = Math.max(0, VectorMath.dot(normal, lightDir));
    // Windowed quadratic distance falloff: 1 at the light, 0 at range, smooth
    // in between. Cheaper than true inverse-square, and doesn't explode near 0.
    const atten = (1 - d / this.range) ** 2;
    return lambert * atten * this.intensity;
  }
}

/**
 * Flashlight-style light: a point source that only fires inside a cone.
 * Full strength inside `innerAngle`, smooth fade out to `outerAngle`,
 * dark beyond. Angles are half-angles, in radians.
 */
export class SpotLight extends Light {
  constructor(
    public position: Vector,
    public direction: Vector,
    intensity: number = 1,
    public range: number = 100,
    public innerAngle: number = Math.PI / 6,
    public outerAngle: number = Math.PI / 4
  ) {
    super(intensity);
  }

  toViewSpace(transformer: Transformer, camera: Camera): ViewLight {
    const pos = transformer.pointToCameraSpace(this.position, camera);
    const dir = VectorMath.normalize(transformer.directionToCameraSpace(this.direction, camera));
    // Pre-compute cosines so the per-face check can compare cos(angle) directly
    // and skip an acos every time.
    return new SpotViewLight(
      pos,
      dir,
      this.intensity,
      this.range,
      Math.cos(this.innerAngle),
      Math.cos(this.outerAngle)
    );
  }
}

class SpotViewLight implements ViewLight {
  constructor(
    private position: Vector,
    private direction: Vector,
    private intensity: number,
    private range: number,
    private innerCos: number,
    private outerCos: number
  ) {}
  contributionAt(point: Vector, normal: Vector): number {
    const toPoint = VectorMath.subtract(point, this.position);
    const d = VectorMath.magnitude(toPoint);
    if (d >= this.range || d < VectorMath.EPSILON) return 0;
    const lightDir = new Vector(toPoint.x / d, toPoint.y / d, toPoint.z / d);

    // Spot cone angular falloff: cos of the angle between the ray to this
    // surface and the spot's axis. Larger cosine = closer to the axis.
    const cosAngle = VectorMath.dot(lightDir, this.direction);
    let coneFactor: number;
    if (cosAngle >= this.innerCos)
      coneFactor = 1; // inside the hot core
    else if (cosAngle <= this.outerCos)
      return 0; // outside the cone entirely
    // Soft edge: linear ramp from outer (0) to inner (1).
    else coneFactor = (cosAngle - this.outerCos) / (this.innerCos - this.outerCos);

    // Same Lambert + windowed-quadratic distance falloff as PointLight,
    // gated by the cone factor.
    const lambert = Math.max(0, VectorMath.dot(normal, lightDir));
    const atten = (1 - d / this.range) ** 2;
    return lambert * coneFactor * atten * this.intensity;
  }
}
