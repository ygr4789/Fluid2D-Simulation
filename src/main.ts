"use strict";
import * as glm from "gl-matrix";
/** @type {HTMLCanvasElement} */

import "../style/style.css";
import {
  HEIGHT,
  WIDTH,
  GRAVITY,
  KERNEL_DISTANCE,
  RESTITUTION,
  TIMESTEP,
  WATER_COLOR,
  WATER_DENSITY,
  WATER_K_FACTOR,
  WATER_VISCOSITY,
  poly6Grad,
  poly6Kernel,
  poly6Lap,
} from "./consts";
import { Particle } from "./particle";

let particles: Array<Particle> = [];
let hashTable: Array<Array<Particle>>;

let max_hi = HEIGHT / KERNEL_DISTANCE + 1;
let max_wi = WIDTH / KERNEL_DISTANCE + 1;

function updateHashTable() {
  hashTable = new Array(max_hi * max_wi);
  for (let i = 0; i < hashTable.length; i++) {
    hashTable[i] = new Array();
  }
  particles.forEach((p) => {
    let hi = Math.floor(p.pos[1] / KERNEL_DISTANCE);
    let wi = Math.floor(p.pos[0] / KERNEL_DISTANCE);
    let cell = hashTable[hi * max_hi + wi];
    cell.push(p);
  });
}

const dh = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
const dw = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
function hashNearNeighbors(loc: glm.vec2) {
  let ret: Array<Particle> = [];
  let hi = Math.floor(loc[1] / KERNEL_DISTANCE);
  let wi = Math.floor(loc[0] / KERNEL_DISTANCE);
  for (let i = 0; i < 9; i++) {
    let hi_ = hi + dh[i];
    let wi_ = wi + dw[i];
    if (hi_ < 0 || hi_ >= max_hi) continue;
    if (wi_ < 0 || wi_ >= max_wi) continue;
    hashTable[hi_ * max_hi + wi_].forEach((p) => {
      if (glm.vec2.dist(loc, p.pos) < KERNEL_DISTANCE) ret.push(p);
    });
  }
  return ret;
}

function getNearNeighbors(loc: glm.vec2) {
  let ret: Array<Particle> = [];
  particles.forEach((p) => {
    if (glm.vec2.dist(loc, p.pos) < KERNEL_DISTANCE) ret.push(p);
  });
  return ret;
}

function sizeCanvas() {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  // width = window.innerWidth;
  // height = window.innerHeight;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.fillStyle = WATER_COLOR;
  ctx.beginPath();
  ctx.arc(p.pos[0], HEIGHT - p.pos[1], 1, 0, 2 * Math.PI);
  // ctx.stroke();
  ctx.fill();
}

function initParticles(size: number) {
  const left = 0;
  const right = 100;
  const bottom = 0;
  const top = 300;
  for (let x = left + size / 2; x < right; x += size) {
    for (let y = bottom + size / 2; y < top; y += size) {
      particles.push(new Particle(x + (Math.random() * size) / 10, y + (Math.random() * size) / 10, 1));
    }
  }
  updateHashTable();
  computeDensity();
  let max_density = 0;
  particles.forEach((p) => {
    max_density = Math.max(max_density, p.density);
  });
  const WATER_PARTICLE_MASS = WATER_DENSITY / max_density;
  particles.forEach((p) => {
    p.mass = WATER_PARTICLE_MASS;
  });
}

function render() {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  // Clear the canvas and redraw all particles
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  particles.forEach((p) => {
    drawParticle(ctx, p);
  });
}

function computeDensity() {
  let r = glm.vec2.create();
  particles.forEach((p) => {
    p.density = 0;
    hashNearNeighbors(p.pos).forEach((p_) => {
      glm.vec2.sub(r, p.pos, p_.pos);
      p.density += p_.mass * poly6Kernel(r);
    });
  });
}
function computePressure() {
  particles.forEach((p) => {
    p.pressure = WATER_K_FACTOR * (p.density - WATER_DENSITY);
  });
}
function computeAcceleration() {
  let r = glm.vec2.create();
  let acc_pressure = glm.vec2.create();
  let acc_viscosity = glm.vec2.create();
  let acc_p_ = glm.vec2.create();
  let acc_v_ = glm.vec2.create();
  particles.forEach((p) => {
    glm.vec2.copy(p.acc, GRAVITY);
    glm.vec2.zero(acc_pressure);
    glm.vec2.zero(acc_viscosity);
    hashNearNeighbors(p.pos).forEach((p_) => {
      glm.vec2.sub(r, p.pos, p_.pos);
      acc_p_ = poly6Grad(r);
      glm.vec2.scale(acc_p_, acc_p_, ((p_.mass / p_.density) * (p.pressure + p_.pressure)) / 2);
      glm.vec2.add(acc_pressure, acc_pressure, acc_p_);

      glm.vec2.sub(acc_v_, p.vel, p_.vel);
      glm.vec2.scale(acc_v_, acc_v_, (p_.mass / p_.density) * poly6Lap(r));
      glm.vec2.add(acc_viscosity, acc_viscosity, acc_v_);
    });
    glm.vec2.scaleAndAdd(p.acc, p.acc, acc_pressure, -1 / p.density);
    glm.vec2.scaleAndAdd(p.acc, p.acc, acc_viscosity, -WATER_VISCOSITY);
  });
}
function updateParcitles(dt: number) {
  particles.forEach((p) => {
    p.update(dt);
  });
}
function handleBoundaries() {
  particles.forEach((p) => {
    if (p.pos[0] < 0) {
      p.pos[0] = 0;
      p.vel[0] *= -RESTITUTION;
    }
    if (p.pos[0] > WIDTH) {
      p.pos[0] = WIDTH;
      p.vel[0] *= -RESTITUTION;
    }
    if (p.pos[1] < 0) {
      p.pos[1] = 0;
      p.vel[1] *= -RESTITUTION;
    }
    if (p.pos[1] > HEIGHT) {
      p.pos[1] = HEIGHT;
      p.vel[1] *= -RESTITUTION;
    }
  });
}

function simulate() {
  updateHashTable();
  computeDensity();
  computePressure();
  computeAcceleration();
  updateParcitles(TIMESTEP);
  handleBoundaries();
}

// Main animation loop
function animate() {
  simulate();
  render();
  // Schedule the next frame
  window.requestAnimationFrame(animate);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Initialize
  initParticles(4);

  // Schedule the main animation loop
  animate();
};
