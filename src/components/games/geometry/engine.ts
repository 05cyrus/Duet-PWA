/**
 * Geometry Track — core game data & pure logic (no DOM).
 * Deterministic level generation so both partners race identical tracks.
 */

export const TILE = 44;            // world tile size in px
export const PLAYER = 34;          // player square size
export const GROUND_H = 64;        // ground strip height

export type TileKind = "spike" | "block" | "block2" | "coin" | "coinAir" | "checkpoint" | "finish";

export interface WorldTile {
  x: number;          // world x in px
  kind: TileKind;
}

export interface Difficulty {
  id: "chill" | "normal" | "insane";
  label: string;
  emoji: string;
  speed: number;       // px per second
  density: number;     // obstacle probability per slot
  scoreMult: number;
}

export const DIFFICULTIES: Difficulty[] = [
  { id: "chill", label: "Chill", emoji: "🌸", speed: 300, density: 0.32, scoreMult: 1 },
  { id: "normal", label: "Normal", emoji: "💪", speed: 380, density: 0.45, scoreMult: 1.5 },
  { id: "insane", label: "Insane", emoji: "🔥", speed: 460, density: 0.58, scoreMult: 2.2 },
];

export interface LevelDef {
  id: number;
  name: string;
  lengthTiles: number;
  palette: { sky: [string, string]; ground: string; accent: string };
}

export const LEVELS: LevelDef[] = [
  { id: 1, name: "First Date", lengthTiles: 190, palette: { sky: ["#ffd9e2", "#e7dbff"], ground: "#f43f6e", accent: "#8b5cf6" } },
  { id: 2, name: "Long Distance", lengthTiles: 260, palette: { sky: ["#dbeafe", "#fbe4ff"], ground: "#8b5cf6", accent: "#f43f6e" } },
  { id: 3, name: "Honeymoon Rush", lengthTiles: 330, palette: { sky: ["#ffe8d1", "#ffd9e2"], ground: "#fb7195", accent: "#f59e0b" } },
];

export interface Skin {
  id: string;
  name: string;
  cost: number;            // coins needed to unlock
  colors: [string, string];
  face: string;
}

export const SKINS: Skin[] = [
  { id: "blush", name: "Blush", cost: 0, colors: ["#fb7195", "#f43f6e"], face: "😊" },
  { id: "lilac", name: "Lilac", cost: 0, colors: ["#a688fa", "#7c3aed"], face: "😎" },
  { id: "sunny", name: "Sunny", cost: 30, colors: ["#fdba74", "#f59e0b"], face: "🤩" },
  { id: "minty", name: "Minty", cost: 60, colors: ["#6ee7b7", "#10b981"], face: "🐸" },
  { id: "royal", name: "Royal", cost: 120, colors: ["#fde68a", "#eab308"], face: "👑" },
  { id: "cosmic", name: "Cosmic", cost: 200, colors: ["#c4b3ff", "#312e81"], face: "🌌" },
];

/** Mulberry32 seeded PRNG — deterministic tracks. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a level track. Patterns are placed in slots of 4–7 tiles with
 * breathing room, checkpoints at thirds, finish flag at the end.
 */
export function buildTrack(level: LevelDef, density: number): WorldTile[] {
  const rand = rng(level.id * 7919 + Math.round(density * 100));
  const tiles: WorldTile[] = [];
  const startPad = 10;
  const end = level.lengthTiles;
  const cp1 = Math.floor(end / 3), cp2 = Math.floor((end * 2) / 3);

  let t = startPad;
  while (t < end - 8) {
    if (t === cp1 || t === cp2) {
      tiles.push({ x: t * TILE, kind: "checkpoint" });
      t += 4;
      continue;
    }
    if (rand() < density) {
      const pattern = Math.floor(rand() * 5);
      switch (pattern) {
        case 0: // single spike
          tiles.push({ x: t * TILE, kind: "spike" });
          t += 4;
          break;
        case 1: // double spike
          tiles.push({ x: t * TILE, kind: "spike" });
          tiles.push({ x: (t + 1) * TILE, kind: "spike" });
          t += 5;
          break;
        case 2: // block hop with coin on top
          tiles.push({ x: t * TILE, kind: "block" });
          tiles.push({ x: t * TILE, kind: "coinAir" });
          t += 4;
          break;
        case 3: // stair: block then tall block
          tiles.push({ x: t * TILE, kind: "block" });
          tiles.push({ x: (t + 2) * TILE, kind: "block2" });
          tiles.push({ x: (t + 2) * TILE, kind: "coinAir" });
          t += 6;
          break;
        default: // spike + block combo
          tiles.push({ x: t * TILE, kind: "spike" });
          tiles.push({ x: (t + 2) * TILE, kind: "block" });
          t += 6;
          break;
      }
    } else {
      if (rand() < 0.3) tiles.push({ x: t * TILE, kind: "coin" });
      t += 2 + Math.floor(rand() * 2);
    }
  }
  tiles.push({ x: end * TILE, kind: "finish" });
  return tiles;
}

/* --------------------------- physics constants ---------------------------- */

export const GRAVITY = 2600;        // px/s²
export const JUMP_V = -940;         // px/s
export const MAX_FALL = 1600;

export interface PlayerState {
  x: number;       // world x
  y: number;       // top-left y
  vy: number;
  grounded: boolean;
  rotation: number;
  dead: boolean;
  finished: boolean;
}

/** Axis-aligned overlap helper. */
export function overlaps(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
