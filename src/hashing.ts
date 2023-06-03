import { vec2 } from "gl-matrix";
import { HEIGHT, WIDTH, KERNEL_DISTANCE, PADDING, SQR_KERNEL_DISTANCE } from "./consts";
import { Particle } from "./particle";

const max_hi = Math.floor((HEIGHT + 2 * PADDING) / KERNEL_DISTANCE);
const max_wi = Math.floor((WIDTH + 2 * PADDING) / KERNEL_DISTANCE);

let particles: Array<Particle>;
let particleNum: number;
let indexOfNum: Uint32Array;
let countTable: Uint32Array;
let particleTable: Uint32Array;
let tableSize = max_hi * max_wi;

function index(hi: number, wi: number) {
  return hi * max_hi + wi;
}

export function bindHashTable(particles_: Array<Particle>) {
  particles = particles_;
  tableSize = max_hi * max_wi;
  particleNum = particles.length;
  indexOfNum = new Uint32Array(particleNum);
  countTable = new Uint32Array(tableSize + 1);
  particleTable = new Uint32Array(particleNum);
}

export function updateHashTable() {
  for (let i = 0; i < particleNum; i++) {
    let p = particles[i];
    let hi = Math.floor((p.pos[1] + PADDING) / KERNEL_DISTANCE);
    let wi = Math.floor((p.pos[0] + PADDING) / KERNEL_DISTANCE);
    indexOfNum[i] = index(hi, wi);
  }
  countTable.fill(0);
  for (let i = 0; i < particleNum; i++) {
    countTable[indexOfNum[i]]++;
  }
  for (let i = 0; i < tableSize; i++) {
    countTable[i + 1] += countTable[i];
  }
  for (let i = 0; i < particleNum; i++) {
    particleTable[--countTable[indexOfNum[i]]] = i;
  }
}

const dh = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
const dw = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
export function hashNearNeighbors(loc: vec2) {
  let ret: Array<Particle> = [];
  let hi = Math.floor((loc[1] + PADDING) / KERNEL_DISTANCE);
  let wi = Math.floor((loc[0] + PADDING) / KERNEL_DISTANCE);

  for (let k = 0; k < 9; k++) {
    let hi_ = hi + dh[k];
    let wi_ = wi + dw[k];
    if (hi_ < 0 || hi_ >= max_hi) continue;
    if (wi_ < 0 || wi_ >= max_wi) continue;

    let i = index(hi_, wi_);
    let begin = countTable[i];
    let end = countTable[i + 1];
    for (let k = begin; k < end; k++) {
      let t = particleTable[k];
      if (vec2.sqrDist(loc, particles[t].pos) < SQR_KERNEL_DISTANCE) ret.push(particles[t]);
    }
  }
  return ret;
}

export function naiveNearNeighbors(loc: vec2, particles: Array<Particle>) {
  let ret: Array<Particle> = [];
  particles.forEach((p) => {
    if (vec2.sqrDist(loc, p.pos) < SQR_KERNEL_DISTANCE) ret.push(p);
  });
  return ret;
}
