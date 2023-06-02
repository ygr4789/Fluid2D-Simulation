import { WATER_DENSITY, poly6Kernel } from "./consts";
import { Particle } from "./particle";

export let interactionParticle = new Particle(0, 0, 0);
const I_MASS = WATER_DENSITY / poly6Kernel([0, 0]);

export function setInteractoin(canvas: HTMLCanvasElement) {
  window.onmousedown = () => {interactionParticle.mass = I_MASS}
  window.onmouseup = () => {interactionParticle.mass = 0}
  canvas.onmousemove = (e) => {
    let mouseCoord = getMousePos(canvas, e);
    interactionParticle.pos[0] = mouseCoord.x; 
    interactionParticle.pos[1] = mouseCoord.y; 
  }
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: canvas.height - (evt.clientY - rect.top)
  };
}
