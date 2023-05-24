"use strict";
import * as glm from "gl-matrix";
/** @type {HTMLCanvasElement} */

import "../style/style.css";
import { GRAVITY, HEIGHT, RESTITUTION, TIMESTEP, WATER_COLOR, WATER_DENSITY, WIDTH } from "./consts";
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
  ctx.arc(p.pos[0], HEIGHT - p.pos[1], 5, 0, 2 * Math.PI);
  // ctx.stroke();
  ctx.fill();
}

function initParticles(size: number) {
  for (let x = size / 2; x < 100; x += size) {
    for (let y = size / 2; y < 300; y += size) {
      particles.push(new Particle(x, y, WATER_DENSITY * size ** 2));
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
    if (glm.vec2.dist(loc, p_.pos) < dist) particles.push(p_);
  });
  return ret;
}

function computeDensity() {}
function computePressure() {}
function computeAcceleration() {
  particles.forEach((p) => {
    glm.vec2.copy(p.acc, GRAVITY);
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
function animationLoop() {
  simulate();
  render();
  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Initialize
  initParticles(10);

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};
