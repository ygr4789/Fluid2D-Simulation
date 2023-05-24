import * as glm from "gl-matrix";

export class Particle {
  pos: glm.vec2;
  vel: glm.vec2;
  acc: glm.vec2;
  pressure: number;
  density: number;
  mass: number;
  constructor(x: number, y: number, mass: number) {
    this.pos = glm.vec2.fromValues(x, y);
    this.vel = glm.vec2.create();
    this.acc = glm.vec2.create();
    this.mass = mass;
  }
  update(dt: number) {
    glm.vec2.scaleAndAdd(this.vel, this.vel, this.acc, dt)
    glm.vec2.scaleAndAdd(this.pos, this.pos, this.vel, dt)
  }
}
