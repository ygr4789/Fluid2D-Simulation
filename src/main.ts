"use strict";
import { vec2 } from "gl-matrix";
import * as Stats from "stats.js";
/** @type {HTMLCanvasElement} */

import "../style/style.css";
import {
  HEIGHT,
  WIDTH,
  PADDING,
  GRAVITY,
  WALL_COLOR,
  WATER_DENSITY,
  WATER_GAS_CONSTANT,
  WATER_VISCOSITY,
  poly6Grad,
  poly6Kernel,
  poly6Lap,
  HOUSE_COLOR,
  waterColor,
} from "./consts";
import { Particle } from "./particle";
import { interactionParticle, setInteractoin } from "./interaction";
import { bindHashTable, hashNearNeighbors, updateHashTable } from "./hashing";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
let fluidParticles: Array<Particle> = [];
let boundaryParticles: Array<Particle> = [];
let wallParticles: Array<Particle> = [];
let houseParticles: Array<Particle> = [];

// ======================= RENDER =======================

function sizeCanvas() {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.pos[0], HEIGHT - p.pos[1], size, 0, 2 * Math.PI);
  ctx.fill();
}

let waterParticleSize = 0;
function render() {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  // Clear the canvas and redraw all fluidParticles
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  fluidParticles.forEach((p) => {
    drawParticle(ctx, p, waterParticleSize, waterColor(p.color));
  });
  wallParticles.forEach((p) => {
    drawParticle(ctx, p, 1, WALL_COLOR);
  });
  houseParticles.forEach((p) => {
    drawParticle(ctx, p, 1, HOUSE_COLOR);
  });
}

// ======================= INITIALIZATION =======================

function initfluidParticles(size: number) {
  const left = 0;
  const right = 100;
  const bottom = 0;
  const top = 300;
  for (let x = left + size / 2; x < right; x += size) {
    for (let y = bottom + size / 2; y < top; y += size) {
      let noiseX = (Math.random() * size) / 10;
      let noiseY = (Math.random() * size) / 10;
      fluidParticles.push(new Particle(x + noiseX, y + noiseY, 1));
    }
  }
  bindHashTable(fluidParticles);
  updateHashTable();
  computeDensity(fluidParticles);
  let max_density = 0;
  fluidParticles.forEach((p) => {
    max_density = Math.max(max_density, p.density);
  });
  const WATER_PARTICLE_MASS = WATER_DENSITY / max_density;
  fluidParticles.forEach((p) => {
    p.mass = WATER_PARTICLE_MASS;
  });
  computeProperties(fluidParticles);
}

function initBoundaries(size: number) {
  for (let x = -PADDING + size / 2; x < WIDTH + PADDING; x += size) {
    for (let y = -PADDING + size / 2; y < HEIGHT + PADDING; y += size) {
      if (x > 0 && x < WIDTH && y > 0 && y < HEIGHT) continue;
      boundaryParticles.push(new Particle(x, y, 1));
    }
  }
  bindHashTable(boundaryParticles);
  updateHashTable();
  computeDensity(boundaryParticles);
  boundaryParticles.forEach((p) => {
    let volume = 1 / p.density;
    p.mass = WATER_DENSITY * volume;
  });
  computeDensity(boundaryParticles);
}

function initWall(size: number) {
  const left = WALL_DISTANCE;
  const right = left + 50;
  const bottom = 0;
  const top = WALL_HEIGHT;
  for (let x = left + size / 2; x < right; x += size) {
    for (let y = bottom + size / 2; y < top; y += size) {
      wallParticles.push(new Particle(x, y, 1));
    }
  }
  bindHashTable(wallParticles);
  updateHashTable();
  computeDensity(wallParticles);
  wallParticles.forEach((p) => {
    let volume = 1 / p.density;
    p.mass = 1 * WATER_DENSITY * volume;
  });
  computeDensity(wallParticles);
}

function initHouse(size: number) {
  const left = 550;
  const right = 600;
  const bottom = 0;
  const top = 50;
  for (let x = left + size / 2; x < right; x += size) {
    for (let y = bottom + size / 2; y < top; y += size) {
      houseParticles.push(new Particle(x, y, 1));
    }
  }
  bindHashTable(houseParticles);
  updateHashTable();
  computeDensity(houseParticles);
  houseParticles.forEach((p) => {
    let volume = 1 / p.density;
    p.mass = 1 * WATER_DENSITY * volume;
  });
  computeDensity(houseParticles);
}

function initAll() {
  fluidParticles = [];
  boundaryParticles = [];
  wallParticles = [];
  houseParticles = [];
  waterParticleSize = INITIAL_PARTICLE_DISTANCE / 3;
  initBoundaries(2);
  initWall(2);
  initHouse(2);
  initfluidParticles(INITIAL_PARTICLE_DISTANCE);
  bindHashTable([...fluidParticles, ...boundaryParticles, ...wallParticles, ...houseParticles, interactionParticle]);
}

// ======================= SOLVE =======================

function computeDensity(particles: Array<Particle>) {
  let r = vec2.create();
  particles.forEach((p) => {
    p.density = 0;
    hashNearNeighbors(p.pos).forEach((p_) => {
      vec2.sub(r, p.pos, p_.pos);
      p.density += p_.mass * poly6Kernel(r);
    });
  });
}

function computeProperties(particles: Array<Particle>) {
  let r = vec2.create();
  particles.forEach((p) => {
    p.density = 0;
    p.color = 0;
    hashNearNeighbors(p.pos).forEach((p_) => {
      vec2.sub(r, p.pos, p_.pos);
      let kernel = poly6Kernel(r);
      p.density += p_.mass * kernel;
      p.color += (p_.mass / WATER_DENSITY) * kernel;
    });
    p.pressure = WATER_GAS_CONSTANT * (p.density - WATER_DENSITY);
  });
}

function computeAcceleration(particles: Array<Particle>) {
  let r = vec2.create();
  let acc_pressure = vec2.create();
  let acc_viscosity = vec2.create();
  let acc_p_ = vec2.create();
  let acc_v_ = vec2.create();
  particles.forEach((p) => {
    vec2.copy(p.acc, GRAVITY);
    vec2.zero(acc_pressure);
    vec2.zero(acc_viscosity);
    hashNearNeighbors(p.pos).forEach((p_) => {
      let isBoundary = p_.pressure === undefined;

      // Pressure
      vec2.sub(r, p.pos, p_.pos);
      acc_p_ = poly6Grad(r);
      if (isBoundary) vec2.scale(acc_p_, acc_p_, (p_.mass / p.density) * Math.max(p.pressure, 0));
      else vec2.scale(acc_p_, acc_p_, ((p_.mass / p_.density) * (p.pressure + p_.pressure)) / 2);
      vec2.add(acc_pressure, acc_pressure, acc_p_);

      // Viscosity
      vec2.sub(acc_v_, p.vel, p_.vel);
      if (isBoundary) vec2.scale(acc_v_, acc_v_, (p_.mass / p.density) * poly6Lap(r));
      else vec2.scale(acc_v_, acc_v_, (p_.mass / p_.density) * poly6Lap(r));
      vec2.add(acc_viscosity, acc_viscosity, acc_v_);
    });
    vec2.scaleAndAdd(p.acc, p.acc, acc_pressure, -1 / p.density);
    vec2.scaleAndAdd(p.acc, p.acc, acc_viscosity, -WATER_VISCOSITY);
  });
}

function updateParcitles(particles: Array<Particle>, dt: number) {
  particles.forEach((p) => {
    p.update(dt);
  });
}

function handleBoundaries() {
  fluidParticles.forEach((p) => {
    if (p.pos[0] < 0) {
      p.pos[0] = 0;
      p.vel[0] = 0;
    }
    if (p.pos[0] > WIDTH) {
      p.pos[0] = WIDTH;
      p.vel[0] = 0;
    }
    if (p.pos[1] < 0) {
      p.pos[1] = 0;
      p.vel[0] = 0;
    }
    if (p.pos[1] > HEIGHT) {
      p.pos[1] = HEIGHT;
      p.vel[0] = 0;
    }
  });
}

// ======================= CONTROLLERS =======================

let WALL_DISTANCE = 200;
let WALL_HEIGHT = 100;
let INITIAL_PARTICLE_DISTANCE = 10;
let TIMESTEP = 0.013;
document.querySelector("#resetButton")?.addEventListener("click", initAll);
document.querySelector("#wallDistanceSlider")?.addEventListener("input", (e) => {
  let value = (e.target as HTMLInputElement).value;
  (document.querySelector("#wallDistanceValue") as HTMLParagraphElement).innerHTML = value;
  WALL_DISTANCE = parseInt(value);
});
document.querySelector("#wallHeightSlider")?.addEventListener("input", (e) => {
  let value = (e.target as HTMLInputElement).value;
  (document.querySelector("#wallHeightValue") as HTMLParagraphElement).innerHTML = value;
  WALL_HEIGHT = parseInt(value);
});
document.querySelector("#resolutionSlider")?.addEventListener("input", (e) => {
  let value = (e.target as HTMLInputElement).value;
  (document.querySelector("#resolutionValue") as HTMLParagraphElement).innerHTML = value;
  INITIAL_PARTICLE_DISTANCE = 10 / (1 + parseInt(value) / 5);
});
document.querySelector("#timeStepSlider")?.addEventListener("input", (e) => {
  let value = (e.target as HTMLInputElement).value;
  (document.querySelector("#timeStepValue") as HTMLParagraphElement).innerHTML = value;
  TIMESTEP = parseFloat(value);
});

// ======================= MAIN =======================

function simulate() {
  updateHashTable();
  computeProperties(fluidParticles);
  computeAcceleration(fluidParticles);
  updateParcitles(fluidParticles, TIMESTEP);
  handleBoundaries();
}

// Main animation loop
function main() {
  // Initialize
  initAll();
  // Interaction
  setInteractoin(canvas);
  // Display Stats
  const stats = new Stats();
  stats.dom.style.position = 'absolute';
  document.querySelector("#canvasContainer")!.appendChild(stats.dom);
  
  animate();
  // Schedule the main animation loop
  function animate() {
    stats.begin();
    simulate();
    render();
    stats.end();
    // Schedule the next frame
    window.requestAnimationFrame(animate);
  }
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  sizeCanvas();
  main();
};
