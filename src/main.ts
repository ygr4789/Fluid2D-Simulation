"use strict";
import * as glm from "gl-matrix";
/** @type {HTMLCanvasElement} */

import "../style/style.css";
import { WATER_COLOR, WATER_DENSITY } from "./consts";
import { Particle } from "./particle";

let width = 600;
let height = 400;
let particles: Array<Particle> = [];

function sizeCanvas() {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  // width = window.innerWidth;
  // height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.fillStyle = WATER_COLOR;
  ctx.beginPath();
  ctx.arc(p.pos[0], p.pos[1], 5, 0, 2 * Math.PI);
  // ctx.stroke();
  ctx.fill();
}

function initParticles(d: number) {
  for (let x = d / 2; x < 100; x += d) {
    for (let y = d / 2; y < 300; y += d) {
      particles.push(new Particle(x, height - y, WATER_DENSITY * d ** 2));
    }
  }
}

function render() {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  // Clear the canvas and redraw all particles
  ctx.clearRect(0, 0, width, height);
  particles.forEach((p) => {
    drawParticle(ctx, p);
  });
}

function getNearNeighbors(loc: glm.vec2, dist: number) {
  let ret:Array<Particle> = [];
  particles.forEach((p_) => {
    if(glm.vec2.dist(loc, p_.pos) < dist) particles.push(p_)
  })
  return 
}

// Main animation loop
function animationLoop() {
  // updateParcitles()
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
