# glyph3d

A 3D engine that renders with ASCII characters instead of pixels.

Read about how it works: [frq.world/blog/glyph3d](https://frq.world/blog/glyph3d)

```bash
npm install glyph3d
```
```typescript
import { Engine, Scene, MeshBuilder, Camera, Animation, Vector } from "glyph3d";
const engine = new Engine(canvas);
const scene = new Scene(engine);
const camera = new Camera("cam", scene, 0, 0, new Vector(0, 0, 200));
const cube = MeshBuilder.Cube("cube", scene, {
  position: { x: -25, y: -25, z: -25 },
  size: 50,
});
cube.color = "#00ff00";
cube.animate(new Animation(2000, 0, "ease", "infinite", {
  0: { yaw: 0 },
  100: { yaw: Math.PI * 2 },
}));
engine.runRenderLoop(() => scene.render());
```
---
## Meshes
### Cube
```typescript
const cube = MeshBuilder.Cube("cube", scene, {
  position: { x: 0, y: 0, z: 0 },
  size: 50,
});
```
### Extrude
Create 3D shapes from 2D outlines. Supports holes.
```typescript
// Define a square outline. Must be wound counter-clockwise
const shape = [
  new Vector(0, 0, 0),
  new Vector(50, 0, 0),
  new Vector(50, 50, 0),
  new Vector(0, 50, 0),
];
// Optional: cut a hole (must be wound in reverse to vertices)
const hole = [
  new Vector(10, 10, 0),
  new Vector(10, 40, 0),
  new Vector(40, 40, 0),
  new Vector(40, 10, 0),
];
const frame = MeshBuilder.Extrude("frame", scene, {
  shape,
  holes: [hole],
  depth: 20,
});
```
---
## Cameras
### Camera
Static camera. Good for watching animations.
```typescript
const camera = new Camera("cam", scene, 0, 0, new Vector(0, 0, 200));
```
### RotateCamera
Orbits around a target point. Supports mouse interaction.
```typescript
const camera = new RotateCamera("cam", scene, 0, 0, new Vector(0, 0, 0), 300); // Last argument defines distance from focal point
camera.attachControl(canvas);
```
The last parameter is the orbital distance from the target.
---
## Animation
Keyframe-based, similar to CSS animations.
```typescript
mesh.animate(new Animation(
  2000,       // duration ms
  0,          // delay ms
  "ease",     // "ease" | "linear" (currently does nothing, yet to be implmented)
  "infinite", // iterations (number or "infinite")
  {
    0:   { yaw: 0, pitch: 0 },
    100: { yaw: Math.PI * 2, pitch: Math.PI },
  }
));
```
Properties: `yaw`, `pitch`
---
## Scene
```typescript
const scene = new Scene(engine);
scene.backgroundColor = "black";
```
---
## Cleanup
```typescript
engine.dispose();
```

---

## Learn more

For a detailed write-up on how glyph3d works under the hood, check out the blog post: **[frq.world/blog/glyph3d](https://frq.world/blog/glyph3d)**
