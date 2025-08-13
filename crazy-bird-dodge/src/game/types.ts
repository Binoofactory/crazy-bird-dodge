export type Vec = { x: number; y: number };
export type Entity = Vec & { id: number; w: number; h: number };
export type Bird = Entity & { alive: boolean; beingShot?: boolean };
export type Hunter = Entity & {
  color: string;
  name: string;
  speed: number;
  targetPlayer: boolean;
  shotCooldown: number; // seconds 0.2 ~ 0.4
};
