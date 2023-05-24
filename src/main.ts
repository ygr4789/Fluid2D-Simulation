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
  WATER_PARTICLE_MASS,
  WATER_VISCOSITY,
  poly6Grad,
  poly6Kernel,
  poly6Lap,
} from "./consts";
import { Particle } from "./particle";

let particles: Array<Particle> = [];

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
  ctx.arc(p.pos[0], HEIGHT - p.pos[1], 2, 0, 2 * Math.PI);
  // ctx.stroke();
  ctx.fill();
}

function initParticles(size: number) {
  for (let x = size / 2; x < 100; x += size) {
    for (let y = size / 2; y < 300; y += size) {
      particles.push(
        new Particle(x + (Math.random() * size) / 10, y + (Math.random() * size) / 10, WATER_PARTICLE_MASS)
      );
    }
  }
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

function getNearNeighbors(loc: glm.vec2, dist: number) {
  let ret: Array<Particle> = [];
  particles.forEach((p_) => {
    if (glm.vec2.dist(loc, p_.pos) < dist) ret.push(p_);
  });
  return ret;
}

function computeDensity() {
  let r = glm.vec2.create();
  particles.forEach((p) => {
    p.density = 0;
    getNearNeighbors(p.pos, KERNEL_DISTANCE).forEach((p_) => {
      glm.vec2.sub(r, p.pos, p_.pos);
      p.density += p_.mass * poly6Kernel(r, KERNEL_DISTANCE);
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
    getNearNeighbors(p.pos, KERNEL_DISTANCE).forEach((p_) => {
      glm.vec2.sub(r, p.pos, p_.pos);
      acc_p_ = poly6Grad(r, KERNEL_DISTANCE);
      glm.vec2.scale(acc_p_, acc_p_, ((p_.mass / p_.density) * (p.pressure + p_.pressure)) / 2);
      glm.vec2.add(acc_pressure, acc_pressure, acc_p_);

      glm.vec2.sub(acc_v_, p.vel, p_.vel);
      glm.vec2.scale(acc_v_, acc_v_, (p_.mass / p_.density) * poly6Lap(r, KERNEL_DISTANCE));
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
  initParticles(KERNEL_DISTANCE);

  // Schedule the main animation loop
  animate();
};
