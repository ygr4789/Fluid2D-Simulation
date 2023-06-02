import { vec2 } from "gl-matrix";

export const WIDTH = 600;
export const HEIGHT = 400;
export const PADDING = 10;

export const WATER_DENSITY = 998;
export const WATER_GAS_CONSTANT = 100000;
export const WATER_VISCOSITY = 100;
export const WATER_COLOR = "#4040ff";
export const WALL_COLOR = "#ff0000";
export const HOUSE_COLOR = "#00ff00";

export const TIMESTEP = 1 / 60;
export const GRAVITY = vec2.fromValues(0, -100);

export const KERNEL_DISTANCE = 10;
const SQR_KERNEL_DISTANCE = KERNEL_DISTANCE ** 2;

export function waterColor(color: number) {
  let t = (color - 1) / 0.1;
    if(t > 1) t = 1;
    if(t < 0) t = 0;
    t = Math.floor(255 * t);
    return `rgb(${255 - t}, ${255 - t}, 255)`;
}

const KERNEL_FACTOR = 315 / 64 / Math.PI / KERNEL_DISTANCE ** 9;
export function poly6Kernel(r: vec2) {
  let sqrd = vec2.sqrLen(r);
  return KERNEL_FACTOR * (SQR_KERNEL_DISTANCE - sqrd) ** 3;
}

const GRAD_FACTOR = -45 / Math.PI / KERNEL_DISTANCE ** 6;
export function poly6Grad(r: vec2) {
  let d = vec2.len(r);
  let ret = vec2.clone(r);
  if (d === 0) {
    vec2.zero(ret);
    return ret;
  }
  vec2.scale(ret, ret, (GRAD_FACTOR * (KERNEL_DISTANCE - d) ** 2) / d);
  return ret;
}

const LAP_FACTOR = 45 / Math.PI / KERNEL_DISTANCE ** 6;
export function poly6Lap(r: vec2) {
  let d = vec2.len(r);
  return LAP_FACTOR * (KERNEL_DISTANCE - d);
}
