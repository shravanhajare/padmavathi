import * as THREE from 'three';
import type { WoodId } from '@/data/types';
import { mulberry32 } from './noise';

/**
 * Procedural solid wood.
 *
 * Instead of wrapping a 2D picture of wood around each object, the grain is
 * computed from the object-space position in the fragment shader, the way a
 * real log works: growth rings are cylinders around a pith, warped by noise,
 * and pores streak along the fibre. Turned pieces therefore show "cathedral"
 * figure along their length, and cut ends show end-grain rings, for free.
 *
 * It is a MeshPhysicalMaterial with a few shader chunks patched in, so
 * lighting, shadows, clearcoat (the oiled finish) and tone mapping all behave
 * like any other three.js material. Every species shares one shader program;
 * only uniforms differ.
 */

export type Species = WoodId | 'fresh' | 'pale';

interface SpeciesDef {
  early: string;
  late: string;
  pore: string;
  /** growth rings per scene unit (1 unit = 10 cm) */
  ringFreq: number;
  /** how far noise pushes the rings around (wavy figure) */
  warp: number;
  /** contrast between early and late wood, 0..1 */
  figure: number;
  poreAmt: number;
  /** pore streak frequency across the grain */
  poreScale: number;
  /** large blotchy colour variation */
  mottle: number;
  /** long colour streaks along the fibre */
  streak: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  bump: number;
}

export const SPECIES: Record<Species, SpeciesDef> = {
  teak: {
    early: '#b98352',
    late: '#744624',
    pore: '#57341a',
    ringFreq: 30,
    warp: 0.07,
    figure: 0.85,
    poreAmt: 0.45,
    poreScale: 70,
    mottle: 0.12,
    streak: 0.22,
    roughness: 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.36,
    bump: 0.0016,
  },
  sheesham: {
    early: '#9c5a36',
    late: '#462213',
    pore: '#321609',
    ringFreq: 36,
    warp: 0.08,
    figure: 0.9,
    poreAmt: 0.55,
    poreScale: 64,
    mottle: 0.16,
    streak: 0.38,
    roughness: 0.4,
    clearcoat: 0.32,
    clearcoatRoughness: 0.34,
    bump: 0.0015,
  },
  neem: {
    early: '#dcc093',
    late: '#b08a5c',
    pore: '#937045',
    ringFreq: 26,
    warp: 0.06,
    figure: 0.7,
    poreAmt: 0.35,
    poreScale: 80,
    mottle: 0.08,
    streak: 0.14,
    roughness: 0.54,
    clearcoat: 0.22,
    clearcoatRoughness: 0.36,
    bump: 0.0014,
  },
  acacia: {
    early: '#bb8347',
    late: '#553016',
    pore: '#3d200c',
    ringFreq: 22,
    warp: 0.1,
    figure: 1,
    poreAmt: 0.4,
    poreScale: 60,
    mottle: 0.2,
    streak: 0.36,
    roughness: 0.44,
    clearcoat: 0.48,
    clearcoatRoughness: 0.25,
    bump: 0.0017,
  },
  /** freshly cut, unoiled log interior (carving sequence) */
  fresh: {
    early: '#e6c592',
    late: '#b98a55',
    pore: '#9b7042',
    ringFreq: 30,
    warp: 0.07,
    figure: 0.75,
    poreAmt: 0.3,
    poreScale: 70,
    mottle: 0.1,
    streak: 0.12,
    roughness: 0.72,
    clearcoat: 0.02,
    clearcoatRoughness: 0.6,
    bump: 0.0018,
  },
  /** light plank wood for crates and shelves */
  pale: {
    early: '#dfbd8a',
    late: '#b48a58',
    pore: '#9c744c',
    ringFreq: 18,
    warp: 0.09,
    figure: 0.75,
    poreAmt: 0.3,
    poreScale: 55,
    mottle: 0.14,
    streak: 0.2,
    roughness: 0.62,
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
    bump: 0.0018,
  },
};

export type GrainAxis = 'x' | 'y' | 'z';

export interface WoodOptions {
  /** Fibre direction in object space. Turned pieces run along y, planks along x. */
  axis?: GrainAxis;
  /** Pith position in the plane across the fibre. Far away = straight grain, near = arches and rings. */
  pith?: [number, number];
  /** How much the pith drifts per unit along the fibre, which draws cathedral arches. */
  tilt?: [number, number];
  /** Picks a different piece of the virtual log, so neighbours don't look identical. */
  seed?: number;
  /** Multiplies the pattern frequency (2 = twice as fine). */
  scale?: number;
  /** 0 = dry, freshly sanded wood; 1 = oiled. Can be animated via `setWoodOil`. */
  oil?: number;
}

// ───────────────────────── noise texture ─────────────────────────

let noiseTexture: THREE.DataTexture | null = null;

/**
 * 256² value-noise texture where G is R shifted by (37, 17). Sampling it with
 * the lattice trick gives smooth 3D noise from a single texture fetch.
 */
export function woodNoiseTexture() {
  if (noiseTexture) return noiseTexture;
  const size = 256;
  const rng = mulberry32(1337);
  const r = new Uint8Array(size * size);
  for (let i = 0; i < r.length; i++) r[i] = Math.floor(rng() * 256);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      data[i] = r[y * size + x];
      data[i + 1] = r[((y + 17) & 255) * size + ((x + 37) & 255)];
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
  noiseTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
  noiseTexture.magFilter = THREE.LinearFilter;
  noiseTexture.minFilter = THREE.LinearFilter;
  noiseTexture.generateMipmaps = false;
  noiseTexture.colorSpace = THREE.NoColorSpace;
  noiseTexture.needsUpdate = true;
  return noiseTexture;
}

// ───────────────────────── shader patches ─────────────────────────

const VERT_PARS = /* glsl */ `
varying vec3 vWoodPos;
`;

const VERT_MAIN = /* glsl */ `
vWoodPos = position;
#ifdef USE_INSTANCING
  // every instance gets its own piece of the virtual log
  float woodId = float(gl_InstanceID);
  vWoodPos += vec3(fract(woodId * 0.618) * 5.0, fract(woodId * 0.371) * 5.0, fract(woodId * 0.853) * 5.0);
#endif
`;

const FRAG_PARS = /* glsl */ `
uniform sampler2D uWoodNoise;
uniform vec3 uWoodEarly;
uniform vec3 uWoodLate;
uniform vec3 uWoodPore;
uniform vec4 uWoodA;      // ringFreq, warp, figure, poreAmt
uniform vec4 uWoodB;      // poreScale, mottle, bump, oil
uniform vec4 uWoodPith;   // pith.xy, tilt.xy
uniform vec4 uWoodC;      // streak, -, -, -
uniform vec3 uWoodSeed;
uniform mat3 uWoodGrain;
varying vec3 vWoodPos;

float woodNoise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
  vec2 rg = texture2D(uWoodNoise, (uv + 0.5) / 256.0).rg;
  return mix(rg.x, rg.y, f.z);
}

float woodFbm(vec3 p) {
  return woodNoise(p) * 0.5 + woodNoise(p * 2.07 + 11.3) * 0.3 + woodNoise(p * 4.13 + 5.1) * 0.2;
}

vec3 woodPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sx = dFdx(surfPos);
  vec3 sy = dFdy(surfPos);
  vec3 r1 = cross(sy, surfNorm);
  vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

const FRAG_COLOR = /* glsl */ `
vec3 wg = uWoodGrain * vWoodPos + uWoodSeed;
// broad, gentle wander of the rings plus a finer ripple
float woodWarp = woodFbm(wg * vec3(0.9, 0.9, 0.09)) - 0.5;
float woodRipple = woodNoise(wg * vec3(4.0, 4.0, 0.35)) - 0.5;
vec2 woodRp = wg.xy - (uWoodPith.xy + uWoodPith.zw * wg.z) + woodWarp * uWoodA.y + woodRipple * uWoodA.y * 0.18;
float woodRing = length(woodRp) * uWoodA.x;
float woodId = floor(woodRing);
float woodFr = fract(woodRing);
// each growth ring has its own width of latewood and darkness
float woodVar = fract(sin(woodId * 12.9898 + uWoodSeed.x) * 43758.5453);
// earlywood darkens gradually into latewood, then snaps back at the ring boundary
float woodStart = mix(0.3, 0.58, woodVar);
float woodBand = pow(smoothstep(woodStart, 0.94, woodFr), 1.6) * (1.0 - smoothstep(0.945, 1.0, woodFr));
// fade the rings to their average where they get finer than a pixel (no moiré)
float woodAA = clamp(fwidth(woodRing) * 1.6 - 0.25, 0.0, 1.0);
// latewood lines fade in and out along the board instead of reading as drawn lines
float woodFade = woodNoise(wg * vec3(1.6, 1.6, 0.45) + 2.3);
float woodLate = mix(woodBand * mix(0.5, 1.0, woodVar) * mix(0.35, 1.2, woodFade), 0.22, woodAA);
float woodPs = uWoodB.x;
float woodP = woodNoise(wg * vec3(woodPs, woodPs, woodPs * 0.03));
float woodPoreAA = clamp(fwidth(wg.x * woodPs + wg.y * woodPs) * 0.6, 0.0, 1.0);
float woodPore = smoothstep(0.62, 0.88, woodP) * (1.0 - woodPoreAA);
float woodM = woodFbm(wg * vec3(0.7, 0.7, 0.12) + 3.7);
vec3 woodCol = mix(uWoodEarly, uWoodLate, woodLate * uWoodA.z);
woodCol = mix(woodCol, uWoodPore, woodPore * uWoodA.w);
woodCol *= mix(1.0 - uWoodB.y, 1.0 + uWoodB.y, woodM);
// long colour streaks running with the fibre (strong in rosewood and acacia)
float woodStreak = woodFbm(wg * vec3(2.4, 2.4, 0.05) + 9.1);
woodCol *= mix(1.0 - uWoodC.x, 1.0 + uWoodC.x * 0.45, smoothstep(0.25, 0.75, woodStreak));
// dry, freshly sanded wood is paler and flatter than oiled wood
woodCol = mix(min(woodCol * 1.28 + vec3(0.05, 0.04, 0.025), vec3(1.0)), woodCol, uWoodB.w);
diffuseColor.rgb *= woodCol;
float woodH = woodLate * 0.5 - woodPore * 0.7 + woodM * 0.1;
`;

const FRAG_ROUGH = /* glsl */ `
roughnessFactor = clamp(roughnessFactor + woodPore * 0.12 - woodLate * 0.05 + (1.0 - uWoodB.w) * 0.2, 0.05, 1.0);
`;

const FRAG_NORMAL = /* glsl */ `
normal = woodPerturb(-vViewPosition, normal, vec2(dFdx(woodH), dFdy(woodH)) * uWoodB.z, faceDirection);
`;

export interface WoodUniforms {
  uWoodNoise: { value: THREE.Texture };
  uWoodEarly: { value: THREE.Color };
  uWoodLate: { value: THREE.Color };
  uWoodPore: { value: THREE.Color };
  uWoodA: { value: THREE.Vector4 };
  uWoodB: { value: THREE.Vector4 };
  uWoodPith: { value: THREE.Vector4 };
  uWoodC: { value: THREE.Vector4 };
  uWoodSeed: { value: THREE.Vector3 };
  uWoodGrain: { value: THREE.Matrix3 };
}

function grainMatrix(axis: GrainAxis) {
  // rows map object space into grain space where z runs along the fibre
  const m = new THREE.Matrix3();
  if (axis === 'y') m.set(1, 0, 0, 0, 0, 1, 0, 1, 0);
  else if (axis === 'x') m.set(0, 1, 0, 0, 0, 1, 1, 0, 0);
  else m.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  return m;
}

function applyWoodShader(material: THREE.MeshPhysicalMaterial, uniforms: WoodUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_PARS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_MAIN}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_PARS}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${FRAG_COLOR}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${FRAG_ROUGH}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${FRAG_NORMAL}`);
  };
  material.customProgramCacheKey = () => 'pe-wood-v1';
}

const cache = new Map<string, THREE.MeshPhysicalMaterial>();

/**
 * A cached wood material. Materials with the same species and options are
 * shared; all of them share a single compiled shader.
 */
export function woodMaterial(species: Species, opts: WoodOptions = {}): THREE.MeshPhysicalMaterial {
  const axis = opts.axis ?? 'y';
  const pith = opts.pith ?? [0.2, -2.6];
  const tilt = opts.tilt ?? [0.05, 0.12];
  const seed = opts.seed ?? 0;
  const scale = opts.scale ?? 1;
  const oil = opts.oil ?? 1;
  const key = `${species}|${axis}|${pith.join(',')}|${tilt.join(',')}|${seed}|${scale}|${oil}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const s = SPECIES[species];
  const rng = mulberry32(seed * 7919 + 17);
  const uniforms: WoodUniforms = {
    uWoodNoise: { value: woodNoiseTexture() },
    uWoodEarly: { value: new THREE.Color(s.early) },
    uWoodLate: { value: new THREE.Color(s.late) },
    uWoodPore: { value: new THREE.Color(s.pore) },
    uWoodA: { value: new THREE.Vector4(s.ringFreq * scale, s.warp, s.figure, s.poreAmt) },
    uWoodB: { value: new THREE.Vector4(s.poreScale * scale, s.mottle, s.bump, oil) },
    uWoodPith: { value: new THREE.Vector4(pith[0], pith[1], tilt[0], tilt[1]) },
    uWoodC: { value: new THREE.Vector4(s.streak, 0, 0, 0) },
    uWoodSeed: { value: new THREE.Vector3(rng() * 40, rng() * 40, rng() * 40) },
    uWoodGrain: { value: grainMatrix(axis) },
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: s.roughness,
    metalness: 0,
    clearcoat: Math.max(0.01, s.clearcoat * oil),
    clearcoatRoughness: s.clearcoatRoughness,
    sheen: 0.15,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(s.early).multiplyScalar(0.5),
  });
  material.name = `wood:${key}`;
  material.userData.woodUniforms = uniforms;
  material.userData.species = species;
  applyWoodShader(material, uniforms);
  cache.set(key, material);
  return material;
}

/** An uncached copy, for pieces whose finish is animated (e.g. the hero's belan getting oiled). */
export function uniqueWoodMaterial(species: Species, opts: WoodOptions = {}) {
  const base = woodMaterial(species, opts);
  const u = base.userData.woodUniforms as WoodUniforms;
  const uniforms: WoodUniforms = {
    uWoodNoise: u.uWoodNoise,
    uWoodEarly: { value: u.uWoodEarly.value.clone() },
    uWoodLate: { value: u.uWoodLate.value.clone() },
    uWoodPore: { value: u.uWoodPore.value.clone() },
    uWoodA: { value: u.uWoodA.value.clone() },
    uWoodB: { value: u.uWoodB.value.clone() },
    uWoodPith: { value: u.uWoodPith.value.clone() },
    uWoodC: { value: u.uWoodC.value.clone() },
    uWoodSeed: { value: u.uWoodSeed.value.clone() },
    uWoodGrain: { value: u.uWoodGrain.value.clone() },
  };
  const material = base.clone();
  material.userData = { ...base.userData, woodUniforms: uniforms };
  applyWoodShader(material, uniforms);
  return material;
}

/** Blends a wood material between two species' colours (the carved log becoming finished teak). */
export function setWoodBlend(material: THREE.MeshPhysicalMaterial, from: Species, to: Species, t: number) {
  const u = material.userData.woodUniforms as WoodUniforms | undefined;
  if (!u) return;
  const a = SPECIES[from];
  const b = SPECIES[to];
  u.uWoodEarly.value.set(a.early).lerp(_c.set(b.early), t);
  u.uWoodLate.value.set(a.late).lerp(_c.set(b.late), t);
  u.uWoodPore.value.set(a.pore).lerp(_c.set(b.pore), t);
  u.uWoodB.value.w = t;
  material.roughness = THREE.MathUtils.lerp(a.roughness, b.roughness, t);
  material.clearcoat = Math.max(0.01, THREE.MathUtils.lerp(a.clearcoat, b.clearcoat, t));
}

const _c = new THREE.Color();

// ───────────────────────── bark ─────────────────────────

let barkMaps: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null;

/** Canvas-drawn bark: dark, fissured and flaky, running along v. */
export function barkTextures() {
  if (barkMaps) return barkMaps;
  const w = 512;
  const h = 512;
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = bump.width = w;
  color.height = bump.height = h;
  const cc = color.getContext('2d')!;
  const bc = bump.getContext('2d')!;
  const img = cc.createImageData(w, h);
  const bimg = bc.createImageData(w, h);
  const rng = mulberry32(99);
  // ridges: a few dozen wavy vertical fissures, wrapped horizontally
  const fissures = Array.from({ length: 22 }, () => ({ x: rng() * w, amp: 4 + rng() * 10, f: 1 + rng() * 3, ph: rng() * 6.28, width: 2 + rng() * 5 }));
  const flake = Array.from({ length: 2600 }, () => rng());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let d = 1;
      for (const f of fissures) {
        const fx = f.x + Math.sin((y / h) * Math.PI * 2 * f.f + f.ph) * f.amp;
        let dx = Math.abs(x - fx);
        dx = Math.min(dx, w - dx);
        d = Math.min(d, dx / f.width);
      }
      const fiss = Math.min(1, d);
      const n = flake[(x * 7 + y * 13) % flake.length];
      const ridge = 0.55 + 0.45 * fiss;
      const v = ridge * (0.85 + n * 0.25);
      const i = (y * w + x) * 4;
      img.data[i] = Math.round(92 * v);
      img.data[i + 1] = Math.round(70 * v);
      img.data[i + 2] = Math.round(52 * v);
      img.data[i + 3] = 255;
      const b = Math.round(255 * (0.15 + 0.85 * fiss) * (0.9 + n * 0.1));
      bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = b;
      bimg.data[i + 3] = 255;
    }
  }
  cc.putImageData(img, 0, 0);
  bc.putImageData(bimg, 0, 0);
  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpTex = new THREE.CanvasTexture(bump);
  for (const t of [map, bumpTex]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
  }
  barkMaps = { map, bump: bumpTex };
  return barkMaps;
}

let barkMat: THREE.MeshStandardMaterial | null = null;

export function barkMaterial() {
  if (barkMat) return barkMat;
  const { map, bump } = barkTextures();
  barkMat = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 3, roughness: 0.95, color: '#ffffff' });
  barkMat.name = 'bark';
  return barkMat;
}
