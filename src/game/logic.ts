import { BIRD_SIZE, BIRD_SPEED_BASE_MULT, BIRD_STAGE_MULT, CENTER, HUNTER_SIZE, HUNTER_SPEED_MULT, HUNTER_MAXIMUM_COUNT, BIRD_MAXIMUM_COUNT, MAP_H, MAP_W, PLAYER_SPEED } from './constants';
import type { Bird, Hunter } from './types';

let birdId = 1;
let hunterId = 1;
export const rand = (a: number, b: number) => Math.random() * (b - a) + a;
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function makeBird(): Bird {
  const ang = rand(0, Math.PI * 2);
  const spread = rand(0, 40);
  return { id: birdId++, x: CENTER.x + Math.cos(ang) * spread, y: CENTER.y + Math.sin(ang) * spread, w: BIRD_SIZE, h: BIRD_SIZE, alive: true };
}

export function makeHunters(): Hunter[] {
  const arr: Hunter[] = [];
  for (let i = 0; i < HUNTER_MAXIMUM_COUNT; i++) {
    arr.push({
      id: hunterId++, x: rand(0, MAP_W), y: rand(0, MAP_H), w: HUNTER_SIZE, h: HUNTER_SIZE,
      color: `hsl(${Math.floor(rand(0,360))},70%,60%)`, name: `Hunter_${i+1}`,
      speed: PLAYER_SPEED * HUNTER_SPEED_MULT * rand(0.9, 1.1), targetPlayer: false,
      shotCooldown: rand(0.2, 0.4)
    });
  }
  return arr;
}

export function birdSpeed(stage: number) {
  return PLAYER_SPEED * BIRD_SPEED_BASE_MULT * Math.pow(BIRD_STAGE_MULT, Math.max(1, stage - 1));
}

export function moveToward(ax: number, ay: number, bx: number, by: number, speed: number, dt: number) {
  const dx = bx - ax, dy = by - ay; const d = Math.hypot(dx, dy) || 1;
  return { x: ax + (dx / d) * speed * dt * 60, y: ay + (dy / d) * speed * dt * 60 };
}

export function collide(a: {x:number;y:number}, b: {x:number;y:number}, radius = 20) {
  return Math.hypot(a.x - b.x, a.y - b.y) < radius;
}