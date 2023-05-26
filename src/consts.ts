import * as glm from "gl-matrix";

export const WIDTH = 600;
export const HEIGHT = 400;
export const PADDING = 50;

export const WATER_DENSITY = 998;
export const WATER_K_FACTOR = 500000;
export const WATER_COLOR = "#0000ff";
export const WATER_VISCOSITY = 100;
export const WALL_COLOR = "#ff0000"

export const KERNEL_DISTANCE = 10;
export const TIMESTEP = 1 / 60;
export const GRAVITY = glm.vec2.fromValues(0, -10);


const KERNEL_FACTOR = 315 / 64 / Math.PI / KERNEL_DISTANCE ** 9;
export function poly6Kernel(r: glm.vec2) {
  let d = glm.vec2.len(r);
  return KERNEL_FACTOR * (KERNEL_DISTANCE ** 2 - d ** 2) ** 3;
}

const GRAD_FACTOR = -45 / Math.PI / KERNEL_DISTANCE ** 6;
export function poly6Grad(r: glm.vec2) {
  let d = glm.vec2.len(r);
  let ret = glm.vec2.clone(r);
  if (d === 0) {
    glm.vec2.zero(ret);
    return ret;
  }
  glm.vec2.scale(ret, ret, (GRAD_FACTOR * (KERNEL_DISTANCE - d) ** 2) / d);
  return ret;
}

const LAP_FACTOR = 45 / Math.PI / KERNEL_DISTANCE ** 6;
export function poly6Lap(r: glm.vec2) {
  let d = glm.vec2.len(r);
  return LAP_FACTOR * (KERNEL_DISTANCE - d);
}
