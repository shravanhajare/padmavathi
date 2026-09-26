import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

/** Small, fast, seedable PRNG so every procedural model is deterministic. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export const range = (rng: Rng, min: number, max: number) => min + (max - min) * rng();

/** Integer lattice hash in [0, 1). */
export function hash3(i: number, j: number, k: number, salt = 0): number {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul(k | 0, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export interface WorleySample {
  /** distance to nearest feature point */
  d1: number;
  /** distance to 2nd nearest */
  d2: number;
  /** stable random id of the nearest cell, in [0, 1) */
  id: number;
}

/** 3D cellular (Worley) noise. Great for boondi pearls and nut chunks. */
export function worley3(x: number, y: number, z: number, out: WorleySample, salt = 0): WorleySample {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let d1 = 1e9;
  let d2 = 1e9;
  let id = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
        const cx = xi + i;
        const cy = yi + j;
        const cz = zi + k;
        const dx = cx + hash3(cx, cy, cz, salt + 1) - x;
        const dy = cy + hash3(cx, cy, cz, salt + 2) - y;
        const dz = cz + hash3(cx, cy, cz, salt + 3) - z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < d1) {
          d2 = d1;
          d1 = d;
          id = hash3(cx, cy, cz, salt + 4);
        } else if (d < d2) d2 = d;
      }
    }
  }
  out.d1 = Math.sqrt(d1);
  out.d2 = Math.sqrt(d2);
  out.id = id;
  return out;
}

export function createSimplex(seed: number) {
  return new SimplexNoise({ random: mulberry32(seed) });
}

/** Fractal brownian motion on top of simplex noise, returns roughly [-1, 1]. */
export function fbm3(noise: SimplexNoise, x: number, y: number, z: number, octaves = 3, lacunarity = 2, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise.noise3d(x * freq, y * freq, z * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
