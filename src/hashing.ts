import { vec2 } from "gl-matrix";
import { Particle } from "./particle";
import { HEIGHT, KERNEL_DISTANCE, PADDING, WIDTH } from "./consts";

let hashTable: Array<Array<Particle>>;
let max_hi = Math.floor((HEIGHT + 2 * PADDING) / KERNEL_DISTANCE);
let max_wi = Math.floor((WIDTH + 2 * PADDING) / KERNEL_DISTANCE);

export function updateHashTable(particles: Array<Particle>) {
  hashTable = new Array(max_hi * max_wi);
  for (let i = 0; i < hashTable.length; i++) {
    hashTable[i] = new Array();
  }
  particles.forEach((p) => {
    let hi = Math.floor((p.pos[1] + PADDING) / KERNEL_DISTANCE);
    let wi = Math.floor((p.pos[0] + PADDING) / KERNEL_DISTANCE);
    let cell = hashTable[hi * max_hi + wi];
    cell.push(p);
  });
}

const dh = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
const dw = [-1, 0, 1, -1, 0, 1, -1, 0, 1];

export function hashNearNeighbors(loc: vec2) {
  let ret: Array<Particle> = [];
  let hi = Math.floor((loc[1] + PADDING) / KERNEL_DISTANCE);
  let wi = Math.floor((loc[0] + PADDING) / KERNEL_DISTANCE);
  for (let i = 0; i < 9; i++) {
    let hi_ = hi + dh[i];
    let wi_ = wi + dw[i];
    if (hi_ < 0 || hi_ >= max_hi) continue;
    if (wi_ < 0 || wi_ >= max_wi) continue;
    hashTable[hi_ * max_hi + wi_].forEach((p) => {
      if (vec2.dist(loc, p.pos) < KERNEL_DISTANCE) ret.push(p);
    });
  }
  return ret;
}

export function naiveNearNeighbors(loc: vec2, particles: Array<Particle>) {
  let ret: Array<Particle> = [];
  particles.forEach((p) => {
    if (vec2.dist(loc, p.pos) < KERNEL_DISTANCE) ret.push(p);
  });
  return ret;
}