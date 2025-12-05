import { Scene } from "../scene";
import { Vector } from "../vector";

export class Light {
  private readonly name: string;
  private origin: Vector;
  private scene: Scene;

  constructor(name: string, origin: Vector, scene: Scene) {
    this.name = name;
    this.origin = origin;
    this.scene = scene;
  }
}
