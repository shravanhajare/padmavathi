import * as THREE from 'three';
import type { WoodId } from '@/data/types';
import { woodMaterial, type WoodOptions } from './wood';
import { MAT } from './materials';
import { mesh, type Quality } from './utensils';
import { merge, roundedBox } from './geometry';

/**
 * Traditional seated coconut scrapers (thuruvani / chirava). The scraper faces
 * −x: you sit on the +x end and push the half coconut against the blade.
 * Scale: 1 unit = 10 cm.
 */

export interface CoconutSeat {
  /** where the centre of the coconut's cut face goes */
  center: THREE.Vector3;
  /** the direction the cut face (the white meat) points */
  facing: THREE.Vector3;
}

/**
 * A half coconut held on the scraper's blade the way it is actually used:
 * the serrated head sits inside the shell, teeth against the meat. Returns a
 * group whose local +y is the coconut's opening, so spinning it about y turns
 * the coconut on the blade.
 */
export function seatCoconut(scraper: THREE.Object3D, coconut: THREE.Object3D) {
  const seat = scraper.userData.coconut as CoconutSeat;
  const holder = new THREE.Group();
  holder.name = 'coconut-on-blade';
  holder.position.copy(seat.center);
  holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), seat.facing);
  holder.add(coconut);
  return holder;
}

/** A serrated steel disc lying in the x/y plane, centred on the origin, `span` radians of teeth. */
export function serratedDisc(radius: number, teeth: number, toothH: number, thickness = 0.03, span = Math.PI * 2, q: Quality = 'high') {
  const s = new THREE.Shape();
  const full = span >= Math.PI * 2 - 1e-6;
  const start = full ? 0 : -span / 2;
  const n = teeth;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= n * 2; i++) {
    if (full && i === n * 2) break;
    const a = start + (i / (n * 2)) * span;
    const r = i % 2 === 1 ? radius + toothH : radius;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  if (!full) {
    // the back half is a plain round edge
    const back = q === 'high' ? 20 : 10;
    for (let i = 1; i < back; i++) {
      const a = start + span + (i / back) * (Math.PI * 2 - span);
      pts.push(new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius));
    }
  }
  s.setFromPoints(pts);
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.12, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 1,
    curveSegments: 12,
  });
  geo.translate(0, 0, -thickness / 2);
  return geo;
}

function hexBolt() {
  const g = new THREE.Group();
  const head = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 6), MAT.bolt(), 'bolt-head');
  head.position.y = 0.045;
  const washer = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.015, 24), MAT.bolt(), 'washer');
  washer.position.y = 0.008;
  g.add(head, washer);
  return g;
}

function rivet() {
  const m = mesh(new THREE.SphereGeometry(0.035, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), MAT.bolt(), 'rivet');
  return m;
}

// ───────────────────────── bench style ─────────────────────────

export function createBenchScraper(wood: WoodId, q: Quality = 'high', opts: WoodOptions = {}) {
  const root = new THREE.Group();
  root.name = 'scraperBench';
  const topY = 1.7;
  const T = 0.2;

  // seat: rectangle tapering to a narrow front
  const s = new THREE.Shape();
  s.moveTo(2.2, -0.65);
  s.lineTo(-1.1, -0.65);
  s.bezierCurveTo(-1.6, -0.65, -1.8, -0.3, -2.25, -0.28);
  s.lineTo(-2.25, 0.28);
  s.bezierCurveTo(-1.8, 0.3, -1.6, 0.65, -1.1, 0.65);
  s.lineTo(2.2, 0.65);
  s.lineTo(2.2, -0.65);
  const seat = new THREE.ExtrudeGeometry(s, {
    depth: T - 0.06,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: q === 'high' ? 20 : 10,
  });
  seat.rotateX(-Math.PI / 2);
  seat.translate(0, topY - T + 0.03, 0);

  // two leg panels with an arched cut-out
  const legShape = new THREE.Shape();
  const w = 0.56;
  const h = topY - T + 0.02;
  legShape.moveTo(-w, 0);
  legShape.lineTo(-0.3, 0);
  legShape.absarc(0, 0, 0.3, Math.PI, 0, true);
  legShape.lineTo(w, 0);
  legShape.lineTo(w, h);
  legShape.lineTo(-w, h);
  legShape.lineTo(-w, 0);
  const legs = [-1.0, 1.55].map((x) => {
    const g = new THREE.ExtrudeGeometry(legShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 16,
    });
    g.rotateY(Math.PI / 2);
    g.translate(x - 0.08, 0, 0);
    return g;
  });
  root.add(mesh(seat, woodMaterial(wood, { axis: 'x', pith: [-2.2, 0.3], ...opts }), 'bench-seat'));
  root.add(mesh(merge(legs), woodMaterial(wood, { axis: 'y', pith: [2.2, 0.2], seed: 4, ...opts }), 'bench-legs'));

  // steel plate riveted along the tapered front, and the serrated head
  const plate = mesh(new THREE.BoxGeometry(1.25, 0.03, 0.3), MAT.steel(), 'plate');
  plate.position.set(-1.95, topY + 0.015, 0);
  root.add(plate);
  for (const x of [-1.5, -1.85, -2.2]) {
    const r = rivet();
    r.position.set(x, topY + 0.03, 0);
    root.add(r);
  }
  const head = new THREE.Group();
  head.position.set(-2.55, topY + 0.015, 0);
  head.rotation.z = -0.35; // tilted up towards the user
  const neck = mesh(new THREE.BoxGeometry(0.3, 0.03, 0.22), MAT.steel(), 'neck');
  neck.position.x = 0.12;
  const disc = mesh(serratedDisc(0.24, 18, 0.05, 0.03, Math.PI * 1.4, q), MAT.steelTeeth(), 'blade');
  disc.rotation.x = -Math.PI / 2;
  disc.rotation.z = Math.PI;
  disc.position.x = -0.12;
  head.add(neck, disc);
  root.add(head);

  // blade centre and the normal of its plane (tilted with the head), for seating a coconut on it
  const zAxis = new THREE.Vector3(0, 0, 1);
  const bladeCenter = new THREE.Vector3(-0.12, 0, 0).applyAxisAngle(zAxis, head.rotation.z).add(head.position);
  const bladeNormal = new THREE.Vector3(0, 1, 0).applyAxisAngle(zAxis, head.rotation.z);
  root.userData.blade = bladeCenter.clone();
  // the round head sits deep in the cup: its rim teeth reach the white meat
  root.userData.coconut = { center: bladeCenter.clone().addScaledVector(bladeNormal, -0.33), facing: bladeNormal.clone().negate() };
  return root;
}

// ───────────────────────── seat style ─────────────────────────

export function createSeatScraper(wood: WoodId, q: Quality = 'high', opts: WoodOptions = {}) {
  const root = new THREE.Group();
  root.name = 'scraperSeat';
  const mat = woodMaterial(wood, { axis: 'x', pith: [-2.4, 0.35], ...opts });

  // roundedBox is built as w × h with depth along z: w = x, h = y, d = z
  const baseGeo = roundedBox(4.6, 0.2, 1.5, 0.04);
  baseGeo.translate(0, 0.1, 0);

  const back = roundedBox(0.26, 1.5, 1.3, 0.03);
  back.translate(2.15, 0.2 + 0.75, 0);

  const prop = roundedBox(0.36, 1.0, 0.62, 0.03);
  prop.translate(1.35, 0.2 + 0.5, 0);

  // angled top plate: a canted hexagon sloping down towards the blade
  const hex = new THREE.Shape();
  hex.moveTo(-0.6, -0.5);
  hex.lineTo(0.35, -0.75);
  hex.lineTo(0.62, -0.5);
  hex.lineTo(0.62, 0.5);
  hex.lineTo(0.35, 0.75);
  hex.lineTo(-0.6, 0.5);
  hex.lineTo(-0.6, -0.5);
  const plate = new THREE.ExtrudeGeometry(hex, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 3,
  });
  plate.rotateX(-Math.PI / 2);
  const tilt = 0.3;
  plate.rotateZ(tilt);
  plate.translate(1.72, 1.62, 0);
  root.add(mesh(merge([baseGeo, plate]), mat, 'seat'));
  root.add(mesh(merge([back, prop]), woodMaterial(wood, { axis: 'y', pith: [2.4, 0.3], seed: 4, ...opts }), 'seat-uprights'));

  // plate surface height along x (for placing the arm and bolts)
  const plateTop = (x: number) => 1.62 + 0.145 + (x - 1.72) * Math.tan(tilt) * 1;

  // black steel arm: bolted on the plate, cranked down over the edge, then up to the blade
  const pts = [
    new THREE.Vector3(2.12, plateTop(2.12) + 0.03, 0),
    new THREE.Vector3(1.5, plateTop(1.5) + 0.03, 0),
    new THREE.Vector3(1.08, plateTop(1.08) - 0.02, 0),
    new THREE.Vector3(0.82, 1.28, 0),
    new THREE.Vector3(0.56, 1.14, 0),
    new THREE.Vector3(0.3, 1.24, 0),
    new THREE.Vector3(0.08, 1.46, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const bar = new THREE.Shape();
  bar.moveTo(-0.13, -0.028);
  bar.lineTo(0.13, -0.028);
  bar.lineTo(0.13, 0.028);
  bar.lineTo(-0.13, 0.028);
  bar.lineTo(-0.13, -0.028);
  const arm = new THREE.ExtrudeGeometry(bar, { steps: q === 'high' ? 90 : 45, bevelEnabled: false, extrudePath: curve });
  root.add(mesh(arm, MAT.blackSteel(), 'arm'));

  for (const x of [1.95, 1.6]) {
    const b = hexBolt();
    b.position.set(x, plateTop(x) + 0.06, 0);
    b.rotation.z = tilt;
    root.add(b);
  }

  // blade continues the plane of the arm's last segment
  const end = curve.getPoint(1);
  const dir = curve.getTangent(1);
  const blade = new THREE.Group();
  blade.position.copy(end);
  const disc = mesh(serratedDisc(0.3, 26, 0.055, 0.03, Math.PI * 2, q), MAT.steelTeeth(), 'blade');
  // disc lies in the x/y plane; turn it so it contains the tangent and the z axis
  disc.rotation.x = Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(disc);
  disc.position.x = 0.26;
  holder.rotation.z = Math.atan2(dir.y, dir.x);
  blade.add(holder);
  // the disc's normal is +y in holder space, which is the cylinder's own axis
  const boss = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16), MAT.bolt(), 'boss');
  boss.position.set(0.26, 0, 0);
  holder.add(boss);
  root.add(blade);

  const tip = new THREE.Vector3(0.26, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), holder.rotation.z).add(end);
  root.userData.blade = tip;
  // the half coconut cups the blade from beyond its far edge, opening facing back along the arm;
  // placed so the teeth just reach the meat (disc radius 0.355, cavity radius 0.45)
  root.userData.coconut = { center: tip.clone().addScaledVector(dir, -0.095), facing: dir.clone().normalize().negate() };
  return root;
}
