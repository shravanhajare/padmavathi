import * as THREE from 'three';
import type { ModelSpec, WoodId } from '@/data/types';
import {
  CHAKLA,
  createBelan,
  createBoard,
  createChakla,
  createCoconutHalf,
  createCoconutHeap,
  createDabba,
  createDabbaLid,
  createGhotni,
  createHolder,
  createLadle,
  createMathani,
  createMortar,
  createPestle,
  createSpatula,
  createSpoon,
  createWholeSpices,
  mesh,
  type Quality,
} from './utensils';
import { createBenchScraper, createSeatScraper, seatCoconut, type CoconutSeat } from './scrapers';
import { createCrate } from './crate';
import { MAT, standard } from './materials';
import { createTagTexture } from './textures';

/**
 * Product "photo" arrangements. Each returns a group resting on y = 0, used
 * by the render studio (card images) and the live 3D quick view.
 */

/** The lowest point of a seated coconut's rim, where grated coconut falls out (scraper-local). */
export function rimBelow(scraper: THREE.Object3D) {
  const seat = scraper.userData.coconut as CoconutSeat;
  const down = new THREE.Vector3(0, -1, 0);
  // opening facing the floor: gratings fall straight out below the centre
  if (Math.abs(down.dot(seat.facing)) > 0.8) return seat.center.clone();
  const across = down.clone().addScaledVector(seat.facing, -down.dot(seat.facing));
  if (across.lengthSq() < 1e-6) across.set(1, 0, 0);
  return seat.center.clone().addScaledVector(across.normalize(), 0.5);
}

/** Yaw that makes a tool laid along x read as a diagonal from the studio camera. */
const DIAG = 1.4;

/** Lifts an object so its lowest point sits on y = `ground`. */
export function restOn(obj: THREE.Object3D, ground = 0) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  obj.position.y += ground - box.min.y;
  obj.updateMatrixWorld(true);
  return obj;
}

/** Lays a long +y tool down along x, then yaws it. */
function layDown(obj: THREE.Object3D, yaw: number, roll = 0) {
  const g = new THREE.Group();
  obj.rotation.set(0, 0, -Math.PI / 2 + roll);
  g.add(obj);
  g.rotation.y = yaw;
  return g;
}

/** Lays a flat tool (face along +z) face-up, then yaws it. */
function layFlat(obj: THREE.Object3D, yaw: number) {
  const g = new THREE.Group();
  obj.rotation.set(-Math.PI / 2, 0, 0);
  g.add(obj);
  g.rotation.y = yaw;
  return g;
}

/**
 * Stands a +y tool head-up: the handle end at `base`, leaning along `dir`,
 * spun about its own axis by `spin` so the face turns towards the camera.
 */
function pose(tool: THREE.Object3D, length: number, base: THREE.Vector3, dir: THREE.Vector3, spin = 0) {
  const d = dir.clone().normalize();
  const g = new THREE.Group();
  tool.rotation.set(0, spin, 0);
  g.add(tool);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().negate());
  // the tool's head (y = 0) goes to the top, the handle end (y = length) to the base
  g.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI));
  g.position.copy(base).addScaledVector(d, length);
  return g;
}

function ribbonBand(len: number, w: number, t = 0.012) {
  return mesh(new THREE.BoxGeometry(len, t, w), MAT.ribbon(), 'ribbon');
}

function bow() {
  const g = new THREE.Group();
  const loop = new THREE.TorusGeometry(0.28, 0.07, 10, 28);
  loop.scale(1, 0.55, 0.35);
  for (const s of [-1, 1]) {
    const m = mesh(loop, MAT.ribbon(), 'bow-loop');
    m.position.set(s * 0.26, 0.1, 0);
    m.rotation.set(0, 0, s * 0.5);
    g.add(m);
    const tail = mesh(new THREE.BoxGeometry(0.16, 0.012, 0.55), MAT.ribbon(), 'bow-tail');
    tail.position.set(s * 0.14, 0.01, 0.3);
    tail.rotation.set(0, s * 0.45, 0);
    g.add(tail);
  }
  const knot = mesh(new THREE.SphereGeometry(0.11, 16, 12), MAT.ribbon(), 'bow-knot');
  knot.scale.set(1, 0.8, 0.8);
  knot.position.y = 0.08;
  g.add(knot);
  return g;
}

function giftTag() {
  const g = new THREE.Group();
  const card = mesh(
    new THREE.PlaneGeometry(0.36, 0.54),
    standard('tag', { map: createTagTexture(), roughness: 0.85, side: THREE.DoubleSide }),
    'tag',
  );
  g.add(card);
  const string = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 6), MAT.twine(), 'tag-string');
  string.position.y = 0.45;
  g.add(string);
  return g;
}

/** An elliptical loop of jute twine lying in the x/z plane. */
function twineLoop(rx: number, rz: number) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * rx, Math.sin(a * 3) * 0.006, Math.sin(a) * rz);
  });
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, 0.014, 6, true), MAT.twine(), 'twine');
}

export function createProductComposition(spec: ModelSpec, q: Quality = 'high', override?: THREE.Object3D): THREE.Group {
  const root = new THREE.Group();
  root.name = `product-${spec.kind}`;
  const w: WoodId = spec.wood;
  const main = (make: () => THREE.Object3D) => (override ? override.clone(true) : make());

  switch (spec.kind) {
    case 'belan': {
      root.add(restOn(layDown(main(() => createBelan(w, spec.variant, q)), DIAG)));
      break;
    }
    case 'chakla': {
      root.add(main(() => createChakla(w, q)));
      break;
    }
    case 'chaklaBelan': {
      root.add(main(() => createChakla(w, q, { seed: 2 })));
      const b = layDown(createBelan(w, spec.variant ?? 'classic', q), 1.15);
      b.position.set(0.05, CHAKLA.top + 0.238, 0.05);
      root.add(b);
      break;
    }
    case 'mathani': {
      root.add(restOn(layDown(main(() => createMathani(w, spec.variant, q)), DIAG, -0.06)));
      break;
    }
    case 'ghotni': {
      root.add(restOn(layDown(main(() => createGhotni(w, q)), DIAG, -0.08)));
      break;
    }
    case 'spatula': {
      root.add(restOn(layFlat(main(() => createSpatula(w, spec.variant, q)), 0.6)));
      break;
    }
    case 'ladle': {
      const l = main(() => createLadle(w, q));
      l.rotation.x = -Math.PI / 2;
      const g = new THREE.Group();
      g.add(l);
      g.rotation.y = 0.65;
      root.add(restOn(g));
      break;
    }
    case 'spoon': {
      const tea = spec.variant === 'tea6';
      const n = tea ? 6 : 3;
      const reach = tea ? 0.17 * 0.8 + 1.25 : 0.4 * 0.8 + 2.0;
      const fan = new THREE.Group();
      for (let i = 0; i < n; i++) {
        const s = override ? override.clone(true) : createSpoon(w, tea ? 'tea' : 'serving', q, { seed: i });
        s.rotation.x = -Math.PI / 2;
        // handle end towards the fan's pivot, bowl pointing out
        s.position.z = reach + (tea ? 0.6 : 1.0);
        const g = new THREE.Group();
        g.add(s);
        g.rotation.y = (i - (n - 1) / 2) * (tea ? 0.22 : 0.26);
        fan.add(g);
      }
      fan.rotation.y = 2.3;
      root.add(restOn(fan));
      break;
    }
    case 'utensilSet': {
      const holder = createHolder(w, q);
      root.add(holder);
      const tools: Array<[THREE.Object3D, number, number]> = [
        [createSpatula(w, 'flat', q, { seed: 1 }), 0.2, 0.22],
        [createSpatula(w, 'slotted', q, { seed: 2 }), -0.25, 0.2],
        [createLadle(w, q, { seed: 3 }), 1.9, 0.16],
        [createSpoon(w, 'serving', q, { seed: 4 }), 3.3, 0.18],
      ];
      tools.forEach(([tool, yaw, tilt], i) => {
        const g = new THREE.Group();
        tool.rotation.set(Math.PI, 0, 0); // working end up
        tool.position.y = i === 2 ? 3.1 : 3.05;
        const t = new THREE.Group();
        t.add(tool);
        t.rotation.set(tilt, yaw, 0, 'YXZ');
        g.add(t);
        g.position.set(Math.sin(yaw) * 0.12, 0.2, Math.cos(yaw) * 0.12);
        root.add(g);
      });
      break;
    }
    case 'board': {
      const b = main(() => createBoard(w, spec.variant, q));
      b.rotation.y = spec.variant === 'round' ? 0.3 : 0.5;
      root.add(b);
      break;
    }
    case 'dabba': {
      const box = main(() => createDabba(w, spec.variant, q));
      root.add(box);
      const R = (box.userData.radius as number) ?? 1.1;
      const lid = createDabbaLid(w, spec.variant, q);
      lid.rotation.set(-1.15, 0, 0);
      lid.position.set(0.2, R * 0.95, -R - 0.35);
      root.add(lid);
      const spoon = createSpoon('neem', 'tea', q, { seed: 9 });
      spoon.rotation.set(-Math.PI / 2, 0, 0.9);
      spoon.position.set(R * 0.55, 0.02, R + 0.3);
      root.add(restOn(spoon));
      break;
    }
    case 'mortar': {
      const m = main(() => createMortar(w, spec.variant, q));
      root.add(m);
      const p = createPestle(w, spec.variant, q);
      p.rotation.set(0, 0, 0.62);
      p.position.set(0.05, spec.variant === 'wide' ? 0.36 : 0.38, 0);
      const pg = new THREE.Group();
      pg.add(p);
      pg.rotation.y = -0.5;
      root.add(pg);
      const sp = createWholeSpices();
      sp.position.set(-0.2, 0, 0.95);
      root.add(sp);
      break;
    }
    case 'scraperBench': {
      const s = main(() => createBenchScraper(w, q));
      // the half coconut cupped over the round serrated head, the way it is used
      s.add(seatCoconut(s, createCoconutHalf(q)));
      const rim = rimBelow(s);
      const heap = createCoconutHeap(q === 'high' ? 520 : 260, 0.5, 0.26);
      heap.position.set(rim.x, 0, rim.z);
      s.add(heap);
      // the grating end towards the camera, so the coconut on the head is in front
      s.rotation.y = 2.35;
      root.add(s);
      // the other half waits cut-face up, white meat showing
      const spare = createCoconutHalf(q);
      spare.position.set(-1.9, 0.51, 1.9);
      spare.rotation.set(0.35, 0, 0.2);
      root.add(restOn(spare));
      break;
    }
    case 'scraperSeat': {
      const s = main(() => createSeatScraper(w, q));
      const holder = seatCoconut(s, createCoconutHalf(q));
      holder.rotateY(0.6);
      s.add(holder);
      const rim = rimBelow(s);
      const heap = createCoconutHeap(q === 'high' ? 420 : 220, 0.42, 0.2, 7);
      heap.position.set(rim.x, 0.2, rim.z);
      s.add(heap);
      // seen from the seat, looking into the coconut: white meat round the serrated blade
      s.rotation.y = 3.55;
      root.add(s);
      const spare = createCoconutHalf(q);
      spare.position.set(1.4, 0.51, 1.5);
      spare.rotation.set(0.3, 0, -0.25);
      root.add(restOn(spare));
      break;
    }
    case 'giftSet': {
      if (spec.variant === 'spoons') {
        // a tied bundle: tools stacked face to face, heads splayed, twine round the handles
        const bundle = new THREE.Group();
        const items = [
          createSpatula(w, 'flat', q, { seed: 1 }),
          createSpoon(w, 'serving', q, { seed: 2 }),
          createSpatula(w, 'slotted', q, { seed: 3 }),
          createSpoon(w, 'serving', q, { seed: 4 }),
        ];
        items.forEach((it, i) => {
          it.rotation.z = (i - 1.5) * 0.12;
          it.position.set((i - 1.5) * 0.05, i === 1 || i === 3 ? 0.32 : 0, -i * 0.1);
          bundle.add(it);
        });
        for (const y of [1.95, 2.08]) {
          const t = twineLoop(0.17, 0.26);
          t.position.set(0, y, -0.15);
          bundle.add(t);
        }
        const tag = giftTag();
        tag.position.set(0.38, 1.7, 0.05);
        tag.rotation.set(0, 0, 0.35);
        bundle.add(tag);
        root.add(restOn(layFlat(bundle, 0.75)));
        break;
      }
      const crate = createCrate({ q, filled: spec.variant === 'essentials' });
      const { W, D, H } = crate.dims;
      crate.root.rotation.y = -0.35;
      root.add(crate.root);
      if (spec.variant === 'essentials') {
        crate.lid.rotation.x = -1.95;
        const inside = new THREE.Group();
        crate.root.add(inside);
        const chakla = createChakla(w, q, { seed: 4 });
        chakla.rotation.set(Math.PI / 2 - 0.34, 0, 0);
        chakla.position.set(-0.35, 0.28, -1.05);
        inside.add(chakla);
        // the belan is longer than the crate, so it lies in front of it
        const b = layDown(createBelan(w, 'classic', q, { seed: 5 }), 0.95);
        b.position.set(0.7, 0.24, 2.35);
        root.add(b);
        inside.add(pose(createMathani('neem', 'classic', q, { seed: 8 }), 3.0, new THREE.Vector3(-1.2, 0.3, 0.45), new THREE.Vector3(-0.26, 1, 0.22), 0.6));
        inside.add(pose(createSpatula('neem', 'flat', q, { seed: 6 }), 3.0, new THREE.Vector3(1.25, 0.3, -0.7), new THREE.Vector3(0.3, 1, 0.12), -0.35));
        inside.add(pose(createLadle('neem', q, { seed: 7 }), 3.0, new THREE.Vector3(1.15, 0.3, 0.1), new THREE.Vector3(0.32, 1, 0.1), Math.PI - 0.5));
      } else {
        // housewarming: closed, ribboned crate with a tag and the chakla-belan leaning on it
        const band1 = ribbonBand(W + 0.1, 0.34);
        band1.position.set(0, H + 0.1 + 0.008, 0);
        crate.root.add(band1);
        const b2 = mesh(new THREE.BoxGeometry(0.34, 0.012, D + 0.12), MAT.ribbon(), 'ribbon');
        b2.position.set(0, H + 0.1 + 0.014, 0);
        crate.root.add(b2);
        for (const s of [-1, 1]) {
          const side = mesh(new THREE.BoxGeometry(0.34, H + 0.1, 0.012), MAT.ribbon(), 'ribbon');
          side.position.set(0, (H + 0.1) / 2, s * (D / 2 + 0.008));
          crate.root.add(side);
          const side2 = mesh(new THREE.BoxGeometry(0.012, H + 0.1, 0.34), MAT.ribbon(), 'ribbon');
          side2.position.set(s * (W / 2 + 0.035), (H + 0.1) / 2, 0);
          crate.root.add(side2);
        }
        const bw = bow();
        bw.position.set(0, H + 0.13, 0);
        bw.rotation.y = 0.4;
        crate.root.add(bw);
        const tag = giftTag();
        tag.position.set(0.55, H + 0.14, 0.45);
        tag.rotation.set(-Math.PI / 2, 0, -0.6);
        crate.root.add(tag);
        const set = new THREE.Group();
        set.add(createChakla(w, q, { seed: 6 }));
        const bl = layDown(createBelan(w, 'classic', q, { seed: 7 }), 0.2);
        bl.position.set(0, CHAKLA.top + 0.238, 0);
        set.add(bl);
        set.rotation.set(-0.35, -0.2, 0);
        set.position.set(1.6, 0.9, 2.2);
        root.add(restOn(set));
        const m = createMortar(w, 'classic', q);
        m.position.set(-1.9, 0, 1.9);
        root.add(m);
      }
      break;
    }
  }
  return root;
}
