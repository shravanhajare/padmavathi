import * as THREE from 'three';
import type { WoodId } from '@/data/types';
import { woodMaterial, type Species, type WoodOptions } from './wood';
import { MAT, SPICES, spiceMaterial } from './materials';
import { arcPoints, carvedSlab, lathe, merge, roundedRect, type Profile } from './geometry';
import { mulberry32, range } from './noise';

/**
 * Procedural wooden utensils. Scale: 1 unit = 10 cm.
 * Long tools are modelled along +Y (working end at the bottom), so the hero
 * and the product compositions can pose them freely. Every piece of one
 * utensil shares an object space, so the solid grain runs through it
 * continuously, as it would in a piece carved from one billet.
 */

export type Quality = 'high' | 'low';

const seg = (q: Quality, high = 72, low = 36) => (q === 'high' ? high : low);

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, name?: string) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

function group(name: string, ...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.name = name;
  if (children.length) g.add(...children);
  return g;
}

/** Mirrors a half profile (bottom tip → centre, y ≤ 0) into a symmetric full one. */
function mirror(half: Profile): Profile {
  const out: Profile = [...half];
  for (let i = half.length - 2; i >= 0; i--) out.push([half[i][0], -half[i][1]]);
  return out;
}

function groove(r: number, y: number, depth: number, width: number): Profile {
  return [
    [r, y - width],
    [r - depth, y - width * 0.25],
    [r - depth, y + width * 0.25],
    [r, y + width],
  ];
}

// ───────────────────────── rolling pins ─────────────────────────

/** Half profile of the classic belan: dome tip, grooved handle, bead collar, shoulder, barrel. */
function classicHalf(grooved = false): Profile {
  const p: Profile = [
    ...arcPoints(0, -1.895, 0.105, -Math.PI / 2, 0, 7),
    ...groove(0.105, -1.82, 0.012, 0.022),
    [0.112, -1.62],
    [0.116, -1.48],
    [0.118, -1.45],
    [0.136, -1.43],
    [0.138, -1.4],
    [0.124, -1.375],
    [0.122, -1.35],
    [0.132, -1.33],
    [0.168, -1.3],
    [0.203, -1.26],
    [0.224, -1.2],
    [0.232, -1.1],
  ];
  if (grooved) {
    for (let y = -0.95; y < -0.05; y += 0.18) p.push(...groove(0.234, y, 0.014, 0.028));
  }
  p.push([0.236, -0.55], [0.238, 0]);
  return p;
}

export function belanProfile(variant = 'classic'): Profile {
  if (variant === 'tapered') {
    const half: Profile = [...arcPoints(0, -2.005, 0.095, -Math.PI / 2, 0, 7)];
    for (let i = 1; i <= 24; i++) {
      const y = -2.0 + (2.0 * i) / 24;
      const u = 1 - (y / 2.1) ** 2;
      half.push([0.095 + 0.12 * Math.pow(Math.max(0, u), 0.85), y]);
    }
    return mirror(half);
  }
  return mirror(classicHalf(variant === 'grooved'));
}

export function createBelan(wood: WoodId, variant = 'classic', q: Quality = 'high', opts: WoodOptions = {}) {
  const geo = lathe(belanProfile(variant), { segments: seg(q) });
  return group('belan', mesh(geo, woodMaterial(wood, { axis: 'y', ...opts }), 'belan'));
}

// ───────────────────────── chakla ─────────────────────────

export const CHAKLA = { radius: 1.15, feet: 0.12, top: 0.44 };

export function createChakla(wood: WoodId, q: Quality = 'high', opts: WoodOptions = {}) {
  const { radius: R, feet: F, top: T } = CHAKLA;
  const profile: Profile = [
    [0, F],
    [R - 0.07, F],
    ...arcPoints(R - 0.07, F + 0.05, 0.05, -Math.PI / 2, 0, 4),
    [R, T - 0.1],
    ...arcPoints(R - 0.1, T - 0.1, 0.1, 0, Math.PI / 2, 8),
    [R - 0.12, T],
    [0.4, T + 0.004],
    [0, T + 0.006],
  ];
  const board = lathe(profile, { segments: seg(q, 96, 48) });
  const footProfile: Profile = [
    [0, 0],
    ...arcPoints(0.08, 0.04, 0.04, -Math.PI / 2, 0, 4),
    [0.13, 0.1],
    [0.14, F + 0.02],
    [0, F + 0.02],
  ];
  const feet = [0, 1, 2].map((k) => {
    const g = lathe(footProfile, { segments: 20 });
    const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
    g.translate(Math.cos(a) * 0.78, 0, Math.sin(a) * 0.78);
    return g;
  });
  const mat = woodMaterial(wood, { axis: 'x', pith: [-2.4, 0.35], tilt: [0.02, 0.1], ...opts });
  return group('chakla', mesh(merge([board, ...feet]), mat, 'chakla'));
}

// ───────────────────────── churners ─────────────────────────

function mathaniHead(blades: number, R: number, H: number, q: Quality) {
  const bladeT = R * 0.34;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.02);
  shape.lineTo(R * 0.42, 0);
  shape.quadraticCurveTo(R, 0, R, H * 0.26);
  shape.lineTo(R, H * 0.7);
  shape.quadraticCurveTo(R, H, R * 0.42, H);
  shape.lineTo(0, H);
  shape.lineTo(0, 0.02);
  const parts: THREE.BufferGeometry[] = [];
  const curl = 1.3;
  for (let k = 0; k < blades; k++) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: bladeT - 0.024,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: q === 'high' ? 12 : 6,
      steps: 1,
    });
    g.translate(0, 0, -(bladeT - 0.024) / 2);
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    const base = (k / blades) * Math.PI * 2;
    for (let i = 0; i < pos.count; i++) {
      const r = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // curve each blade a little, so the end view reads as a flower
      const phi = base + curl * r * r * 4;
      pos.setXYZ(i, Math.cos(phi) * r - Math.sin(phi) * z, y, Math.sin(phi) * r + Math.cos(phi) * z);
    }
    g.computeVertexNormals();
    parts.push(g);
  }
  parts.push(
    lathe(
      [
        [0, 0.03],
        [R * 0.3, 0.03],
        [R * 0.3, H],
        [0, H],
      ],
      { segments: 24 },
    ),
  );
  return parts;
}

export function createMathani(wood: WoodId, variant = 'classic', q: Quality = 'high', opts: WoodOptions = {}) {
  const grand = variant === 'grand';
  const R = grand ? 0.33 : 0.27;
  const H = grand ? 0.52 : 0.44;
  const L = grand ? 4.5 : 3.0;
  const hr = grand ? 0.075 : 0.062;
  const handle: Profile = [
    [0, H - 0.02],
    [R * 0.45, H - 0.02],
    [R * 0.48, H + 0.03],
    [R * 0.4, H + 0.08],
    ...groove(R * 0.36, H + 0.12, 0.012, 0.02),
    [R * 0.32, H + 0.18],
    [hr * 1.15, H + 0.3],
    [hr, H + 0.45],
    [hr, L - 0.7],
    [hr * 1.35, L - 0.62],
    [hr * 1.35, L - 0.52],
    [hr, L - 0.44],
    [hr, L - 0.18],
    ...arcPoints(0, L - 0.1, hr * 1.25, -0.9, Math.PI / 2, 8),
  ];
  const parts = [...mathaniHead(grand ? 8 : 6, R, H, q), lathe(handle, { segments: seg(q, 40, 24) })];
  return group('mathani', mesh(merge(parts), woodMaterial(wood, { axis: 'y', pith: [0.1, -1.6], ...opts }), 'mathani'));
}

export function createGhotni(wood: WoodId, q: Quality = 'high', opts: WoodOptions = {}) {
  const profile: Profile = [
    [0, 0],
    [0.2, 0],
    ...arcPoints(0.22, 0.08, 0.08, -Math.PI / 2, 0, 5),
    [0.3, 0.12],
    [0.31, 0.3],
    [0.3, 0.46],
    [0.25, 0.56],
    [0.15, 0.64],
    [0.105, 0.72],
    ...groove(0.1, 0.8, 0.012, 0.02),
    [0.1, 1.2],
    [0.115, 2.3],
    [0.12, 2.52],
    ...arcPoints(0, 2.62, 0.13, -0.4, Math.PI / 2, 8),
  ];
  const geo = lathe(profile, {
    segments: seg(q, 96, 48),
    radial: (theta, y) => {
      const mask = THREE.MathUtils.smoothstep(y, 0.04, 0.14) * (1 - THREE.MathUtils.smoothstep(y, 0.4, 0.52));
      return 1 - 0.075 * mask * Math.pow(0.5 + 0.5 * Math.cos(theta * 10), 2);
    },
  });
  return group('ghotni', mesh(geo, woodMaterial(wood, { axis: 'y', ...opts }), 'ghotni'));
}

// ───────────────────────── spatulas ─────────────────────────

function spatulaShape(slotted: boolean) {
  const s = new THREE.Shape();
  s.moveTo(-0.25, 0);
  s.lineTo(0.25, 0);
  s.quadraticCurveTo(0.31, 0, 0.31, 0.07);
  s.lineTo(0.3, 0.72);
  s.bezierCurveTo(0.29, 0.98, 0.16, 1.05, 0.15, 1.3);
  s.lineTo(0.14, 2.74);
  s.quadraticCurveTo(0.14, 3.0, 0, 3.0);
  s.quadraticCurveTo(-0.14, 3.0, -0.14, 2.74);
  s.lineTo(-0.15, 1.3);
  s.bezierCurveTo(-0.16, 1.05, -0.29, 0.98, -0.3, 0.72);
  s.lineTo(-0.31, 0.07);
  s.quadraticCurveTo(-0.31, 0, -0.25, 0);
  const hole = new THREE.Path();
  hole.absarc(0, 2.8, 0.045, 0, Math.PI * 2, true);
  s.holes.push(hole);
  if (slotted) {
    for (const x of [-0.14, 0, 0.14]) {
      const slot = new THREE.Path();
      const w = 0.032;
      slot.absarc(x, 0.26, w, Math.PI, 0, true);
      slot.lineTo(x + w, 0.66);
      slot.absarc(x, 0.66, w, 0, Math.PI, true);
      slot.lineTo(x - w, 0.26);
      s.holes.push(slot);
    }
  }
  return s;
}

export function createSpatula(wood: WoodId, variant = 'flat', q: Quality = 'high', opts: WoodOptions = {}) {
  const geo = carvedSlab(spatulaShape(variant === 'slotted'), {
    thickness: (y) => (y < 0.25 ? 0.028 + (y / 0.25) * 0.02 : y < 1.3 ? 0.048 + ((y - 0.25) / 1.05) * 0.045 : 0.095),
    bevel: 0.014,
    curveSegments: q === 'high' ? 20 : 10,
  });
  return group('spatula', mesh(geo, woodMaterial(wood, { axis: 'y', pith: [0.15, -2.2], ...opts }), 'spatula'));
}

// ───────────────────────── ladles & spoons ─────────────────────────

/** A turned bowl shell (outer surface up to the rim, then the inner surface back down). Opening faces +y, rim at y = 0. */
function bowlShell(R: number, t: number, depth = 0.95, q: Quality = 'high'): THREE.BufferGeometry {
  const steps = q === 'high' ? 16 : 9;
  const out: Profile = [];
  const a0 = -Math.PI / 2;
  const a1 = -Math.asin(0.05);
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([Math.cos(a) * R, Math.sin(a) * R * depth]);
  }
  const rimY = out[out.length - 1][1];
  // rounded lip
  const lipC: [number, number] = [R - t / 2, rimY];
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    out.push([lipC[0] + Math.cos(a) * (t / 2), lipC[1] + Math.sin(a) * (t / 2) * 0.8]);
  }
  const Ri = R - t;
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([Math.cos(a) * Ri, Math.sin(a) * Ri * depth + (rimY - Math.sin(a1) * Ri * depth)]);
  }
  const geo = lathe(out, { segments: seg(q, 56, 28) });
  geo.translate(0, -rimY, 0);
  return geo;
}

function handleShape(len: number, w0: number, w1: number, hole: boolean) {
  const s = new THREE.Shape();
  s.moveTo(-w0 / 2, 0);
  s.lineTo(w0 / 2, 0);
  s.bezierCurveTo(w0 / 2, len * 0.4, w1 / 2, len * 0.6, w1 / 2, len - w1 / 2);
  s.quadraticCurveTo(w1 / 2, len, 0, len);
  s.quadraticCurveTo(-w1 / 2, len, -w1 / 2, len - w1 / 2);
  s.bezierCurveTo(-w1 / 2, len * 0.6, -w0 / 2, len * 0.4, -w0 / 2, 0);
  if (hole) {
    const h = new THREE.Path();
    h.absarc(0, len - w1 * 0.55, w1 * 0.2, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  return s;
}

export function createLadle(wood: WoodId, q: Quality = 'high', opts: WoodOptions = {}) {
  const R = 0.36;
  const bowl = bowlShell(R, 0.036, 0.92, q);
  bowl.rotateX(Math.PI / 2); // opening faces +z
  const handle = carvedSlab(handleShape(2.6, 0.2, 0.24, true), { thickness: (y) => 0.085 - y * 0.006, bevel: 0.02, curveSegments: 12 });
  handle.translate(0, -0.12, 0);
  handle.rotateX(0.42);
  handle.translate(0, R * 0.86, 0.02);
  const mat = woodMaterial(wood, { axis: 'y', pith: [0.1, -2.4], ...opts });
  const g = group('ladle', mesh(merge([bowl, handle]), mat, 'ladle'));
  return g;
}

export function createSpoon(wood: WoodId, size: 'serving' | 'tea' = 'serving', q: Quality = 'high', opts: WoodOptions = {}) {
  const tea = size === 'tea';
  const R = tea ? 0.17 : 0.4;
  const bowl = bowlShell(R, tea ? 0.022 : 0.03, 0.8, q);
  bowl.rotateX(Math.PI / 2);
  bowl.scale(0.66, 1, 0.5);
  const L = tea ? 1.25 : 2.0;
  const handle = carvedSlab(handleShape(L, tea ? 0.06 : 0.12, tea ? 0.1 : 0.21, false), {
    thickness: () => (tea ? 0.045 : 0.07),
    bevel: tea ? 0.012 : 0.018,
    curveSegments: 12,
  });
  const pos = handle.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setZ(i, pos.getZ(i) + 0.18 * (y / L) ** 2 * (tea ? 0.6 : 1));
  }
  handle.computeVertexNormals();
  handle.translate(0, R * 0.8, R * 0.08);
  const mat = woodMaterial(wood, { axis: 'y', pith: [0.1, -2.0], ...opts });
  return group('spoon', mesh(merge([bowl, handle]), mat, 'spoon'));
}

// ───────────────────────── boards ─────────────────────────

function paddleShape() {
  const s = new THREE.Shape();
  const r = 0.24;
  s.moveTo(-1.9 + r, -0.95);
  s.lineTo(0.85, -0.95);
  s.bezierCurveTo(1.05, -0.95, 1.05, -0.3, 1.25, -0.28);
  s.lineTo(1.62, -0.28);
  s.absarc(1.62, 0, 0.28, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(1.25, 0.28);
  s.bezierCurveTo(1.05, 0.3, 1.05, 0.95, 0.85, 0.95);
  s.lineTo(-1.9 + r, 0.95);
  s.quadraticCurveTo(-1.9, 0.95, -1.9, 0.95 - r);
  s.lineTo(-1.9, -0.95 + r);
  s.quadraticCurveTo(-1.9, -0.95, -1.9 + r, -0.95);
  const hole = new THREE.Path();
  hole.absarc(1.66, 0, 0.1, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

export function createBoard(wood: WoodId, variant = 'paddle', q: Quality = 'high', opts: WoodOptions = {}) {
  const mat = woodMaterial(wood, { axis: 'x', pith: [-2.2, 0.4], tilt: [0.03, 0.08], ...opts });
  if (variant === 'round') {
    const R = 1.5;
    const T = 0.2;
    const profile: Profile = [
      [0, 0],
      [R - 0.05, 0],
      ...arcPoints(R - 0.05, 0.05, 0.05, -Math.PI / 2, 0, 4),
      [R, T - 0.05],
      ...arcPoints(R - 0.05, T - 0.05, 0.05, 0, Math.PI / 2, 5),
      [R - 0.14, T],
      [R - 0.16, T - 0.03],
      [R - 0.22, T - 0.03],
      [R - 0.24, T],
      [0, T],
    ];
    return group('board', mesh(lathe(profile, { segments: seg(q, 110, 56) }), mat, 'board'));
  }
  const shape = variant === 'rect' ? roundedRect(3.4, 2.4, 0.14) : paddleShape();
  const T = variant === 'rect' ? 0.16 : 0.18;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: T - 0.07,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 4,
    curveSegments: q === 'high' ? 24 : 12,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.035, 0);
  return group('board', mesh(geo, mat, 'board'));
}

// ───────────────────────── masala dabba ─────────────────────────

export function createDabba(wood: WoodId, variant = 'seven', q: Quality = 'high', opts: WoodOptions = {}) {
  const mini = variant === 'mini';
  const R = mini ? 0.7 : 1.1;
  const H = mini ? 0.62 : 0.72;
  const wall = 0.07;
  const box: Profile = [
    [0, 0],
    [R - 0.06, 0],
    ...arcPoints(R - 0.06, 0.06, 0.06, -Math.PI / 2, 0, 4),
    [R, H - 0.02],
    ...arcPoints(R - 0.02, H - 0.02, 0.02, 0, Math.PI / 2, 3),
    [R - wall + 0.02, H],
    ...arcPoints(R - wall + 0.02, H - 0.02, 0.02, Math.PI / 2, Math.PI, 3),
    [R - wall, 0.14],
    [R - wall - 0.04, 0.1],
    [0, 0.1],
  ];
  const mat = woodMaterial(wood, { axis: 'x', pith: [-2.6, 0.2], ...opts });
  const root = group('dabba');
  root.add(mesh(lathe(box, { segments: seg(q, 96, 48) }), mat, 'box'));

  // spice bowls
  const br = mini ? 0.26 : 0.28;
  const bh = H - 0.2;
  const bowl: Profile = [
    [0, 0.1],
    [br - 0.03, 0.1],
    ...arcPoints(br - 0.03, 0.13, 0.03, -Math.PI / 2, 0, 3),
    [br, 0.1 + bh],
    [br - 0.025, 0.1 + bh],
    [br - 0.025, 0.16],
    [0, 0.15],
  ];
  const bowlGeo = lathe(bowl, { segments: seg(q, 40, 20) });
  const slots: Array<[number, number]> = mini
    ? [0, 1, 2].map((k) => [Math.cos((k / 3) * Math.PI * 2 + 0.5) * 0.33, Math.sin((k / 3) * Math.PI * 2 + 0.5) * 0.33])
    : [[0, 0], ...[0, 1, 2, 3, 4, 5].map((k): [number, number] => [Math.cos((k / 6) * Math.PI * 2) * 0.66, Math.sin((k / 6) * Math.PI * 2) * 0.66])];
  const bowlMat = woodMaterial(wood, { axis: 'y', pith: [0, 0], tilt: [0, 0], seed: 3, ...opts });
  slots.forEach(([x, z], i) => {
    const b = mesh(bowlGeo, bowlMat, 'bowl');
    b.position.set(x, 0, z);
    root.add(b);
    const spice = SPICES[i % SPICES.length];
    const fill: Profile = [
      [0, 0.1 + bh - 0.05],
      [br * 0.55, 0.1 + bh - 0.07],
      [br - 0.03, 0.1 + bh - 0.1],
      [br - 0.03, 0.12],
    ];
    const f = mesh(lathe(fill, { segments: 28 }), spiceMaterial(spice.color, spice.grain), `spice-${spice.name}`);
    f.position.set(x, 0, z);
    f.castShadow = false;
    root.add(f);
  });
  root.userData.height = H;
  root.userData.radius = R;
  return root;
}

export function createDabbaLid(wood: WoodId, variant = 'seven', q: Quality = 'high', opts: WoodOptions = {}) {
  const R = variant === 'mini' ? 0.72 : 1.12;
  const inner = R - 0.1;
  const profile: Profile = [
    [0, -0.06],
    [inner - 0.01, -0.06],
    [inner, -0.05],
    [inner, 0],
    [R - 0.03, 0],
    ...arcPoints(R - 0.03, 0.03, 0.03, -Math.PI / 2, 0, 3),
    [R, 0.07],
    ...arcPoints(R - 0.04, 0.07, 0.04, 0, Math.PI / 2, 4),
    [R * 0.5, 0.13],
    [0.22, 0.14],
    [0.2, 0.17],
    [0.11, 0.195],
    ...arcPoints(0, 0.27, 0.12, -0.6, Math.PI / 2, 6),
  ];
  const mat = woodMaterial(wood, { axis: 'x', pith: [-2.2, 0.5], seed: 5, ...opts });
  return group('lid', mesh(lathe(profile, { segments: seg(q, 96, 48) }), mat, 'lid'));
}

// ───────────────────────── mortar & pestle ─────────────────────────

export function createMortar(wood: WoodId, variant = 'classic', q: Quality = 'high', opts: WoodOptions = {}) {
  const wide = variant === 'wide';
  const R = wide ? 0.66 : 0.5;
  const H = wide ? 0.92 : 1.0;
  const profile: Profile = [
    [0, 0],
    [R * 0.86, 0],
    ...arcPoints(R * 0.86, 0.04, 0.04, -Math.PI / 2, 0, 3),
    [R * 0.9, 0.1],
    [R * 0.84, 0.13],
    [R * 0.7, 0.2],
    [R * 0.72, 0.3],
    [R * 0.86, H * 0.5],
    [R * 0.98, H * 0.8],
    [R, H - 0.03],
    ...arcPoints(R - 0.03, H - 0.03, 0.03, 0, Math.PI / 2, 3),
    [R - 0.1, H],
    ...arcPoints(R - 0.1, H - 0.03, 0.03, Math.PI / 2, Math.PI, 3),
    [R * 0.8, H * 0.7],
    [R * 0.6, H * 0.45],
    [R * 0.3, H * 0.33],
    [0, H * 0.31],
  ];
  const mat = woodMaterial(wood, { axis: 'y', pith: [0, 0.05], tilt: [0.02, 0.02], ...opts });
  return group('mortar', mesh(lathe(profile, { segments: seg(q, 96, 48) }), mat, 'mortar'));
}

export function createPestle(wood: WoodId, variant = 'classic', q: Quality = 'high', opts: WoodOptions = {}) {
  const k = variant === 'wide' ? 1.12 : 1;
  const profile: Profile = [
    ...arcPoints(0, 0.16 * k, 0.16 * k, -Math.PI / 2, 0, 8),
    [0.16 * k, 0.32 * k],
    [0.12 * k, 0.55 * k],
    [0.09 * k, 0.8 * k],
    [0.085 * k, 1.35 * k],
    [0.1 * k, 1.5 * k],
    ...arcPoints(0, 1.58 * k, 0.1 * k, -0.3, Math.PI / 2, 6),
  ];
  const mat = woodMaterial(wood, { axis: 'y', pith: [0.1, -1.4], seed: 2, ...opts });
  return group('pestle', mesh(lathe(profile, { segments: seg(q, 48, 24) }), mat, 'pestle'));
}

// ───────────────────────── holder, coconut & props ─────────────────────────

export function createHolder(wood: WoodId, q: Quality = 'high', opts: WoodOptions = {}) {
  const R = 0.52;
  const H = 1.15;
  const profile: Profile = [
    [0, 0],
    [R - 0.05, 0],
    ...arcPoints(R - 0.05, 0.05, 0.05, -Math.PI / 2, 0, 4),
    ...groove(R, 0.22, 0.015, 0.025),
    [R * 0.97, H * 0.6],
    ...groove(R * 0.99, H - 0.14, 0.012, 0.022),
    [R, H - 0.03],
    ...arcPoints(R - 0.03, H - 0.03, 0.03, 0, Math.PI / 2, 3),
    [R - 0.07, H],
    [R - 0.08, H - 0.04],
    [R - 0.08, 0.16],
    [0, 0.14],
  ];
  const mat = woodMaterial(wood, { axis: 'x', pith: [-2.4, 0.3], seed: 7, ...opts });
  return group('holder', mesh(lathe(profile, { segments: seg(q, 72, 36) }), mat, 'holder'));
}

/** Half a coconut, cut face up: fibrous brown shell and a band of white meat. */
export function createCoconutHalf(q: Quality = 'high') {
  const R = 0.55;
  const shell: Profile = [];
  const steps = q === 'high' ? 14 : 8;
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    shell.push([Math.cos(a) * R, Math.sin(a) * R * 0.92]);
  }
  shell.push([R, 0], [R - 0.025, 0]);
  const meat: Profile = [[R - 0.025, 0], [R - 0.1, 0]];
  for (let i = steps; i >= 0; i--) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    meat.push([Math.cos(a) * (R - 0.1), Math.sin(a) * (R - 0.1) * 0.9]);
  }
  const g = group('coconut');
  g.add(
    mesh(
      lathe(shell, {
        segments: seg(q, 48, 24),
        radial: (theta, y) => 1 + 0.02 * Math.sin(theta * 3 + y * 8) * (y < -0.02 ? 1 : 0),
      }),
      MAT.coconutShell(),
      'shell',
    ),
  );
  g.add(mesh(lathe(meat, { segments: seg(q, 48, 24) }), MAT.coconutMeat(), 'meat'));
  return g;
}

let flakeGeo: THREE.BufferGeometry | null = null;

/** A thin curled sliver of grated coconut. */
export function coconutFlakeGeometry() {
  if (flakeGeo) return flakeGeo;
  const g = new THREE.PlaneGeometry(0.05, 0.016, 4, 1);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, (x / 0.025) ** 2 * 0.008);
  }
  g.computeVertexNormals();
  flakeGeo = g;
  return g;
}

/** A small heap of grated coconut made of instanced slivers. */
export function createCoconutHeap(count = 420, radius = 0.42, height = 0.22, seed = 4) {
  const rng = mulberry32(seed);
  const im = new THREE.InstancedMesh(coconutFlakeGeometry(), MAT.coconutFlake(), count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(rng()) * radius;
    const a = rng() * Math.PI * 2;
    const h = height * Math.pow(1 - r / radius, 1.4) * range(rng, 0.5, 1);
    p.set(Math.cos(a) * r, h, Math.sin(a) * r);
    q.setFromEuler(e.set(rng() * 6.28, rng() * 6.28, rng() * 6.28));
    const k = range(rng, 0.8, 1.5);
    s.set(k, k, k);
    im.setMatrixAt(i, m.compose(p, q, s));
    im.setColorAt(i, c.set(rng() > 0.85 ? '#f1e6cf' : '#fffdf6'));
  }
  im.castShadow = true;
  im.receiveShadow = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  return im;
}

/** A few green cardamom pods and peppercorns for the mortar shot. */
export function createWholeSpices(seed = 8) {
  const rng = mulberry32(seed);
  const g = group('spices');
  const pod = new THREE.SphereGeometry(0.035, 12, 8);
  pod.scale(1, 0.75, 1.7);
  const corn = new THREE.SphereGeometry(0.022, 10, 8);
  for (let i = 0; i < 9; i++) {
    const m = mesh(pod, MAT.cardamom());
    m.position.set(range(rng, -0.3, 0.3), 0.026, range(rng, -0.18, 0.18));
    m.rotation.set(0, rng() * 6.28, range(rng, -0.2, 0.2));
    g.add(m);
  }
  for (let i = 0; i < 12; i++) {
    const m = mesh(corn, MAT.pepper());
    m.position.set(range(rng, -0.4, 0.4), 0.02, range(rng, -0.25, 0.25));
    g.add(m);
  }
  return g;
}

export type { Species };
