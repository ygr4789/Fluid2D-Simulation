import * as glm from "gl-matrix";

export const WIDTH = 600;
export const HEIGHT = 400;

export const WATER_DENSITY = 998;
export const WATER_COLOR = "#0000ff";

export const KERNEL_DISTANCE = 10;
export const TIMESTEP = 0.013;
export const GRAVITY = glm.vec2.fromValues(0, -980);
export const RESTITUTION = 0.5;

export function poly6Kernel(r: glm.vec2, h: number) {
  let d = glm.vec2.len(r);
  return (315 / 64 / Math.PI / h ** 9) * (h ** 2 - d ** 2) ** 3;
}

export function poly6Grad(r: glm.vec2, h: number) {
  let d = glm.vec2.len(r);
  let ret = glm.vec2.clone(r);
  glm.vec2.scale(ret, ret, (-(45 / Math.PI / h ** 6) * (h - d) ** 2) / d ** 2);
}

export function poly6Lap(r: glm.vec2, h: number) {
  let d = glm.vec2.len(r);
  return (45 / Math.PI / h ** 6) * (h - d);
}
