"use strict";

/** @type {HTMLCanvasElement} */

let width = 600;
let height = 400;

function sizeCanvas() {
  const canvas = document.querySelector("#canvas");
  // width = window.innerWidth;
  // height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function drawParticle(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 50, 0, 2 * Math.PI);
  // ctx.stroke();
  ctx.fill();
}

// Main animation loop
function animationLoop() {
  // updateParcitles()

  // Clear the canvas and redraw all particles
  const ctx = document.querySelector("#canvas").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  drawParticle(ctx, width / 2, height / 2, "#ff0000");
  drawParticle(ctx, width / 3, height / 3, "#ff0000");

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Initialize
  // init();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};
