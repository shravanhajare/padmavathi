import * as THREE from 'three';

/**
 * The hero's timeline. Everything is a function of scroll progress p ∈ [0, 1]
 * so the 3D scene and the HTML overlay (GSAP) share one source of truth, and
 * scrubbing backwards just works. Positions are in stage units (1 = 10 cm);
 * the stage is offset/scaled per viewport by `computeLayout`.
 */

export const ease = {
  linear: (t: number) => t,
  in: (t: number) => t * t * t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  expoOut: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  backOut: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** 0 → 1 → 0 bump over [a, b]. */
export const bump = (p: number, a: number, b: number) => Math.sin(Math.PI * seg(p, a, b));

type V3 = [number, number, number];
type Ease = (t: number) => number;

export function track3(keys: Array<[number, V3]>, e: Ease = ease.inOut) {
  return (p: number, out: THREE.Vector3) => {
    if (p <= keys[0][0]) return out.set(...keys[0][1]);
    for (let i = 1; i < keys.length; i++) {
      const [p1, v1] = keys[i];
      if (p <= p1) {
        const [p0, v0] = keys[i - 1];
        const t = e(clamp01((p - p0) / (p1 - p0)));
        return out.set(v0[0] + (v1[0] - v0[0]) * t, v0[1] + (v1[1] - v0[1]) * t, v0[2] + (v1[2] - v0[2]) * t);
      }
    }
    return out.set(...keys[keys.length - 1][1]);
  };
}

export function track1(keys: Array<[number, number]>, e: Ease = ease.inOut) {
  return (p: number) => {
    if (p <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [p1, v1] = keys[i];
      if (p <= p1) {
        const [p0, v0] = keys[i - 1];
        return v0 + (v1 - v0) * e(clamp01((p - p0) / (p1 - p0)));
      }
    }
    return keys[keys.length - 1][1];
  };
}

/** Floor / counter top in stage space. */
export const FLOOR = -1.9;
/** Chakla height (feet + board) and belan radius, for stacking. */
const CHAKLA_TOP = 0.44;
const BELAN_R = 0.238;

// actors exit stage right and wait off-screen until the finale
const PARK_SET: V3 = [9.5, -0.6, -8];
const PARK_CRATE: V3 = [10.5, -1.2, -9];

// finale arrangement on the counter
export const REST = {
  chakla: [-1.5, FLOOR, 1.0] as V3,
  crate: [0.9, FLOOR, -1.15] as V3,
  scraper: [3.55, FLOOR, 0.15] as V3,
  crateYaw: -0.22,
  crateScale: 0.85,
};

export const TIMELINE = {
  log: {
    pos: track3([
      [0.0, [0, 0.45, 0]],
      [0.085, [0, 0.4, 0]],
      [0.12, [0.4, 0.25, 0]],
      [0.345, [0.4, 0.25, 0]],
      [0.4, [0.1, -0.5, 0.35]],
      [0.435, [0, FLOOR + CHAKLA_TOP + BELAN_R, 0.35]],
      [0.5, [0, FLOOR + CHAKLA_TOP + BELAN_R, 0.35]],
      [0.56, [PARK_SET[0], PARK_SET[1] + CHAKLA_TOP + BELAN_R, PARK_SET[2]]],
      [0.84, [PARK_SET[0], PARK_SET[1] + CHAKLA_TOP + BELAN_R, PARK_SET[2]]],
      [0.93, [REST.chakla[0], FLOOR + CHAKLA_TOP + BELAN_R, REST.chakla[2]]],
    ]),
    rot: track3([
      [0.0, [0.32, -0.55, 0.22]],
      [0.085, [0.3, -0.35, 0.14]],
      [0.12, [0, 0, 0]],
      [0.345, [0, 0, 0]],
      [0.435, [0, 0.8, 0]],
      [0.5, [0, 0.8, 0]],
      [0.56, [0, 1.1, 0]],
      [0.84, [0, 1.1, 0]],
      [0.93, [0, 0.55, 0]],
    ]),
    carve: track1([
      [0.135, 0],
      [0.3, 1],
    ], ease.linear),
    finish: track1([
      [0.3, 0],
      [0.355, 1],
    ]),
    centers: track1([
      [0.085, 0],
      [0.12, 1],
      [0.335, 1],
      [0.37, 0],
    ]),
    tool: track1([
      [0.115, 0],
      [0.14, 1],
      [0.3, 1],
      [0.33, 0],
    ]),
    /** lathe speed (rad / s) */
    spin: track1([
      [0.0, 0.35],
      [0.1, 0.35],
      [0.13, 9],
      [0.33, 9],
      [0.37, 0],
    ]),
    /** rolling a roti on the chakla */
    roll: (p: number) => Math.sin(seg(p, 0.445, 0.505) * Math.PI * 4) * 0.32 * bump(p, 0.44, 0.51),
  },

  chakla: {
    pos: track3([
      [0.34, [0, -7.5, 0.35]],
      [0.425, [0, FLOOR, 0.35]],
      [0.5, [0, FLOOR, 0.35]],
      [0.56, PARK_SET],
      [0.84, PARK_SET],
      [0.93, REST.chakla],
    ]),
    rot: track3([
      [0.34, [0.8, -1.2, 0.2]],
      [0.425, [0, 0.2, 0]],
      [0.5, [0, 0.2, 0]],
      [0.56, [0.12, 0.5, 0]],
      [0.84, [0.12, 0.5, 0]],
      [0.93, [0, -0.1, 0]],
    ]),
  },

  /** dough ball → rolled roti */
  roti: {
    show: track1([
      [0.39, 0],
      [0.43, 1],
      [0.82, 1],
      [0.86, 0],
    ]),
    /**
     * Dough height in units: a 0.6 ball, pressed by the belan's weight as it
     * lands, then rolled thin. Volume is preserved, so it spreads as it thins.
     */
    height: track1([
      [0.43, 0.6],
      [0.455, 0.3],
      [0.51, 0.06],
    ]),
  },

  flour: [0.428, 0.485] as const,

  crate: {
    pos: track3([
      [0.485, [0.2, -8, 0.2]],
      [0.535, [0.2, FLOOR, 0.2]],
      [0.655, [0.2, FLOOR, 0.2]],
      [0.715, PARK_CRATE],
      [0.84, PARK_CRATE],
      [0.93, REST.crate],
    ]),
    rot: track3([
      [0.485, [0.4, -1.5, 0]],
      [0.535, [0, -0.3, 0]],
      [0.655, [0, -0.3, 0]],
      [0.715, [0, -0.7, 0]],
      [0.84, [0, -0.7, 0]],
      [0.93, [0, REST.crateYaw, 0]],
    ]),
    lid: track1([
      [0.54, 0],
      [0.575, 1],
    ]),
    /** utensils rising out: start of the first, spacing between the rest */
    rise: [0.55, 0.01, 0.06] as const,
    /** utensils flying into the crate in the finale */
    land: [0.845, 0.01, 0.07] as const,
  },

  scraper: {
    pos: track3([
      [0.655, [10, FLOOR, 0.6]],
      [0.725, [-0.3, FLOOR, 0.6]],
      [0.84, [-0.3, FLOOR, 0.6]],
      [0.93, REST.scraper],
    ]),
    /** base yaw; a slow turntable is added on top while it is centre stage */
    yaw: track1([
      [0.655, -2.2],
      [0.725, -0.55],
      [0.84, 0.35],
      [0.93, 1.45],
    ]),
    flakes: [0.72, 0.83] as const,
  },

  counter: track3(
    [
      [0.82, [0.45, -9, 0]],
      [0.905, [0.45, FLOOR, 0]],
    ],
    ease.out,
  ),

  camera: track3([
    [0.0, [0, 0.5, 12]],
    [0.12, [0, 0.55, 10.4]],
    [0.345, [0, 0.65, 10.6]],
    [0.45, [0, 1.3, 10.5]],
    [0.6, [0, 2.0, 13.8]],
    [0.77, [0, 1.1, 11.6]],
    [0.95, [0, 3.1, 13.6]],
  ]),
  look: track3([
    [0.0, [0, 0.2, 0]],
    [0.12, [0, 0.15, 0]],
    [0.345, [0, 0.1, 0]],
    [0.45, [0, -0.9, 0]],
    [0.6, [0, 0.6, 0]],
    [0.77, [0, -0.6, 0]],
    [0.95, [0, -0.55, 0]],
  ]),
  /** which actor the depth of field focuses on */
  focus: [
    [0.0, 'log'],
    [0.39, 'chakla'],
    [0.5, 'crate'],
    [0.67, 'scraper'],
    [0.85, 'counter'],
  ] as const,
};

/** Dough ball radius; the rolled roti keeps the same volume. */
export const DOUGH_R = 0.3;

/** Horizontal radius of the squashed dough for a given height (volume-preserving ellipsoid). */
export const doughRadius = (h: number) => DOUGH_R * Math.sqrt((2 * DOUGH_R) / Math.max(h, 1e-3));

/** How high the dough stands at distance `d` from its centre. */
export function doughHeightAt(p: number, d: number) {
  const show = TIMELINE.roti.show(p);
  if (show <= 0.001) return 0;
  const h = TIMELINE.roti.height(p) * show;
  const a = doughRadius(TIMELINE.roti.height(p)) * show;
  return h * Math.sqrt(Math.max(0, 1 - (d / a) ** 2));
}

export { CHAKLA_TOP, BELAN_R };

export { CHAPTERS, type ChapterId } from './chapters';

export interface StageLayout {
  x: number;
  y: number;
  scale: number;
  portrait: boolean;
}

/** Where the 3D stage sits for a given viewport aspect (text lives on the left or top). */
export function computeLayout(aspect: number): StageLayout {
  if (aspect >= 1.12) {
    const x = THREE.MathUtils.clamp(1.1 + (aspect - 1.12) * 1.1, 1.1, 2.4);
    return { x, y: 0, scale: 1, portrait: false };
  }
  // phones: the copy takes the top of the screen, the stage fills the lower half
  const scale = THREE.MathUtils.clamp(aspect * 1.15, 0.46, 0.92);
  return { x: 0, y: -0.95 - (1 - scale) * 0.4, scale, portrait: true };
}
