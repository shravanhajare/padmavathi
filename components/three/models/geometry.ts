import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A lathe profile: [radius, y] pairs from bottom to top. Repeat a point to make a hard edge there. */
export type Profile = Array<[number, number]>;

export interface LatheOptions {
  segments?: number;
  phiStart?: number;
  phiLength?: number;
  /** Radius modulation, e.g. flutes: returns a multiplier for the radius at (theta, y). */
  radial?: (theta: number, y: number, r: number, t: number) => number;
}

/**
 * Lathe geometry with normals computed from the profile itself, so turned
 * pieces are perfectly smooth with no seam, while repeated points give crisp
 * edges (a chakla rim, a groove).
 */
export function lathe(profile: Profile, opts: LatheOptions = {}): THREE.BufferGeometry {
  const segments = opts.segments ?? 64;
  const phiStart = opts.phiStart ?? 0;
  const phiLength = opts.phiLength ?? Math.PI * 2;
  const n = profile.length;

  // 2D normals per profile point (one-sided at duplicated points = hard edges)
  const normals2: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const [r, y] = profile[i];
    let tx = 0;
    let ty = 0;
    const prev = profile[i - 1];
    const next = profile[i + 1];
    const addSeg = (ax: number, ay: number, bx: number, by: number) => {
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy);
      if (len < 1e-7) return false;
      tx += dx / len;
      ty += dy / len;
      return true;
    };
    const dupPrev = prev && Math.hypot(prev[0] - r, prev[1] - y) < 1e-7;
    const dupNext = next && Math.hypot(next[0] - r, next[1] - y) < 1e-7;
    if (prev && !dupNext) addSeg(prev[0], prev[1], r, y);
    if (next && !dupPrev) addSeg(r, y, next[0], next[1]);
    if (dupPrev && next) addSeg(r, y, next[0], next[1]);
    if (dupNext && prev) addSeg(prev[0], prev[1], r, y);
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    normals2.push([ty, -tx]);
  }

  // cumulative arc length for v
  const arc: number[] = [0];
  for (let i = 1; i < n; i++) arc.push(arc[i - 1] + Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]));
  const total = arc[n - 1] || 1;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const phi = phiStart + t * phiLength;
    const sin = Math.sin(phi);
    const cos = Math.cos(phi);
    for (let j = 0; j < n; j++) {
      const [r0, y] = profile[j];
      const r = opts.radial ? r0 * opts.radial(phi, y, r0, j / (n - 1)) : r0;
      positions.push(r * sin, y, r * cos);
      const [nr, ny] = normals2[j];
      normals.push(nr * sin, ny, nr * cos);
      uvs.push(t, arc[j] / total);
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < n - 1; j++) {
      const a = j + i * n;
      const b = a + n;
      const c = a + n + 1;
      const d = a + 1;
      indices.push(a, b, d, c, d, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  if (opts.radial) {
    geo.computeVertexNormals();
    // average the seam so the modulated surface stays smooth where it wraps
    const nrm = geo.getAttribute('normal') as THREE.BufferAttribute;
    if (Math.abs(phiLength - Math.PI * 2) < 1e-6) {
      for (let j = 0; j < n; j++) {
        const a = j;
        const b = j + segments * n;
        const x = nrm.getX(a) + nrm.getX(b);
        const y = nrm.getY(a) + nrm.getY(b);
        const z = nrm.getZ(a) + nrm.getZ(b);
        const l = Math.hypot(x, y, z) || 1;
        nrm.setXYZ(a, x / l, y / l, z / l);
        nrm.setXYZ(b, x / l, y / l, z / l);
      }
    }
  }
  return geo;
}

/** A quarter-circle (or any arc) of profile points, for rounded ends and beads. */
export function arcPoints(cx: number, cy: number, radius: number, from: number, to: number, steps = 8): Profile {
  const out: Profile = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    out.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return out;
}

/** Samples a smooth Catmull-Rom curve through [r, y] control points. */
export function smoothProfile(points: Profile, samples = 48): Profile {
  const curve = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)));
  return curve.getSpacedPoints(samples).map((p) => [Math.max(0, p.x), p.y]);
}

/**
 * Extrudes a flat outline (in the x/y plane) and lets the thickness vary along
 * y, which is how a carved spatula tapers from a chunky handle to a thin blade.
 * The result is centred on z = 0.
 */
export function carvedSlab(
  shape: THREE.Shape,
  opts: { thickness: (y: number, x: number) => number; bevel?: number; curveSegments?: number; bevelSegments?: number },
) {
  const bevel = opts.bevel ?? 0.02;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: opts.bevelSegments ?? 4,
    curveSegments: opts.curveSegments ?? 24,
    steps: 1,
  });
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // z runs -bevel .. 1 + bevel; map the core 0..1 to ±t/2 and keep the bevel rounding proportional
    const t = opts.thickness(y, x);
    const zc = z - 0.5;
    const sign = Math.sign(zc) || 1;
    const core = Math.min(Math.abs(zc), 0.5);
    const extra = Math.max(0, Math.abs(zc) - 0.5);
    pos.setZ(i, sign * (core / 0.5) * Math.max(0, t / 2 - bevel) + sign * extra * Math.min(1, t / (2 * bevel + 1e-6)));
  }
  geo.computeVertexNormals();
  return geo;
}

/** Merges geometries that share a material, dropping attributes they don't all have. */
export function merge(geos: THREE.BufferGeometry[]) {
  const keys = ['position', 'normal', 'uv'];
  for (const g of geos) {
    for (const name of Object.keys(g.attributes)) if (!keys.includes(name)) g.deleteAttribute(name);
    if (!g.getAttribute('uv')) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((g.getAttribute('position') as THREE.BufferAttribute).count * 2), 2));
    }
  }
  const list = geos.every((g) => g.index) ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g));
  return mergeGeometries(list, false)!;
}

export { mergeVertices };

/** Rounded rectangle outline centred on the origin. */
export function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A rounded box made by extruding a rounded rect with a bevel. Centred; depth along z. */
export function roundedBox(w: number, h: number, d: number, r = 0.03, bevelSegments = 3) {
  const b = Math.min(r, d / 2 - 1e-3, w / 2 - 1e-3, h / 2 - 1e-3);
  const geo = new THREE.ExtrudeGeometry(roundedRect(w - 2 * b, h - 2 * b, Math.max(1e-3, b * 0.5)), {
    depth: d - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments,
    curveSegments: 6,
  });
  geo.translate(0, 0, -(d - 2 * b) / 2);
  geo.computeVertexNormals();
  return geo;
}
