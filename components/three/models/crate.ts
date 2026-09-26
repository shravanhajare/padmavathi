import * as THREE from 'three';
import { woodMaterial } from './wood';
import { MAT, standard } from './materials';
import { merge, roundedBox } from './geometry';
import { mesh, type Quality } from './utensils';
import { createBrandStamp } from './textures';
import { mulberry32, range } from './noise';

export interface CrateParts {
  root: THREE.Group;
  /** Hinge pivot at the back top edge. `lid.rotation.x = -angle` opens it. */
  lid: THREE.Group;
  dims: { W: number; D: number; H: number };
  /** Inside floor height, for placing contents. */
  floorY: number;
}

function stampMaterial() {
  return standard('brand-stamp', {
    map: createBrandStamp(),
    color: '#ffffff',
    transparent: true,
    roughness: 0.9,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
}

/** A plank-built crate with corner posts, a cleated lid on a hinge, nail heads and the brand burned in. */
export function createCrate(opts: { W?: number; D?: number; H?: number; q?: Quality; filled?: boolean } = {}): CrateParts {
  const W = opts.W ?? 3.6;
  const D = opts.D ?? 2.8;
  const H = opts.H ?? 1.4;
  const q = opts.q ?? 'high';
  const T = 0.1;
  const post = 0.2;
  const gap = 0.06;
  const root = new THREE.Group();
  root.name = 'crate';
  const alongX: THREE.BufferGeometry[] = [];
  const alongZ: THREE.BufferGeometry[] = [];
  const upright: THREE.BufferGeometry[] = [];
  const nails: THREE.Vector3[] = [];
  const nailNormals: THREE.Vector3[] = [];
  const rng = mulberry32(21);

  const plankH = (H - 0.1 - gap) / 2;
  for (let k = 0; k < 2; k++) {
    const y = 0.1 + plankH / 2 + k * (plankH + gap);
    for (const sz of [-1, 1]) {
      const g = roundedBox(W - 0.02, plankH, T, 0.018, 2);
      g.translate(range(rng, -0.01, 0.01), y, sz * (D / 2 - T / 2));
      alongX.push(g);
      for (const sx of [-1, 1]) {
        nails.push(new THREE.Vector3(sx * (W / 2 - post / 2), y, sz * (D / 2 + 0.002)));
        nailNormals.push(new THREE.Vector3(0, 0, sz));
      }
    }
    for (const sx of [-1, 1]) {
      const g = roundedBox(T, plankH, D - 2 * T - 0.01, 0.018, 2);
      g.translate(sx * (W / 2 - T / 2), y, 0);
      alongZ.push(g);
      for (const sz of [-1, 1]) {
        nails.push(new THREE.Vector3(sx * (W / 2 + 0.002), y, sz * (D / 2 - post / 2 - T)));
        nailNormals.push(new THREE.Vector3(sx, 0, 0));
      }
    }
  }
  // corner posts inside the planks
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = roundedBox(post, H - 0.02, post, 0.02, 2);
      g.translate(sx * (W / 2 - T - post / 2 + 0.02), H / 2, sz * (D / 2 - T - post / 2 + 0.02));
      upright.push(g);
    }
  }
  const floor = roundedBox(W - 2 * T, 0.08, D - 2 * T, 0.01, 1);
  floor.translate(0, 0.08, 0);
  alongX.push(floor);

  const matX = woodMaterial('pale', { axis: 'x', pith: [-1.8, 0.2], seed: 11 });
  const matZ = woodMaterial('pale', { axis: 'z', pith: [-1.8, 0.4], seed: 12 });
  const matY = woodMaterial('pale', { axis: 'y', pith: [0.4, -1.2], seed: 13 });
  root.add(mesh(merge(alongX), matX, 'planks-x'), mesh(merge(alongZ), matZ, 'planks-z'), mesh(merge(upright), matY, 'posts'));

  // lid: planks across x with two cleats underneath; pivot at the back top edge
  const lid = new THREE.Group();
  lid.name = 'lid';
  lid.position.set(0, H, -D / 2);
  const lidPlanks: THREE.BufferGeometry[] = [];
  const n = 3;
  const pw = (D - (n - 1) * 0.03) / n;
  for (let i = 0; i < n; i++) {
    const g = roundedBox(W + 0.06, T, pw, 0.02, 2);
    g.translate(0, T / 2, pw / 2 + i * (pw + 0.03));
    lidPlanks.push(g);
    for (const sx of [-1, 1]) {
      nails.push(new THREE.Vector3(sx * (W / 2 - 0.2), H + T + 0.002, -D / 2 + pw / 2 + i * (pw + 0.03)));
      nailNormals.push(new THREE.Vector3(0, 1, 0));
    }
  }
  const cleats: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    const g = roundedBox(0.18, 0.08, D - 0.3, 0.015, 1);
    g.translate(sx * (W / 2 - 0.34), -0.04, D / 2);
    cleats.push(g);
  }
  lid.add(mesh(merge(lidPlanks), woodMaterial('pale', { axis: 'x', pith: [-1.6, 0.3], seed: 14 }), 'lid-planks'));
  lid.add(mesh(merge(cleats), matZ, 'cleats'));
  const stampLid = mesh(new THREE.PlaneGeometry(W * 0.52, W * 0.52 * 0.625), stampMaterial(), 'brand');
  stampLid.rotation.x = -Math.PI / 2;
  stampLid.position.set(0, T + 0.002, D / 2);
  stampLid.castShadow = false;
  lid.add(stampLid);
  root.add(lid);

  const stampFront = mesh(new THREE.PlaneGeometry(W * 0.36, W * 0.36 * 0.625), stampMaterial(), 'brand-front');
  stampFront.position.set(0, H / 2 + 0.02, D / 2 + 0.003);
  stampFront.castShadow = false;
  root.add(stampFront);

  // nail heads (lid nails ride along with the lid)
  const nailGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 10);
  const bodyNails = nails.filter((_, i) => nailNormals[i].y === 0);
  const lidNails = nails.filter((_, i) => nailNormals[i].y === 1);
  const up = new THREE.Vector3(0, 1, 0);
  const place = (list: THREE.Vector3[], normals: THREE.Vector3[], parent: THREE.Object3D, offset: THREE.Vector3) => {
    const im = new THREE.InstancedMesh(nailGeo, MAT.nail(), list.length);
    const m = new THREE.Matrix4();
    const qn = new THREE.Quaternion();
    list.forEach((p, i) => {
      qn.setFromUnitVectors(up, normals[i]);
      im.setMatrixAt(i, m.compose(p.clone().sub(offset), qn, new THREE.Vector3(1, 1, 1)));
    });
    parent.add(im);
  };
  place(bodyNails, nailNormals.filter((v) => v.y === 0), root, new THREE.Vector3());
  place(
    lidNails,
    lidNails.map(() => up),
    lid,
    lid.position,
  );

  if (opts.filled) root.add(createWoodWool(W - 2 * T - 0.1, D - 2 * T - 0.1, 0.14, q === 'high' ? 900 : 400));

  return { root, lid, dims: { W, D, H }, floorY: 0.12 };
}

/** Curly wood-wool packing: a nest of thin shavings to bed the utensils in. */
export function createWoodWool(w: number, d: number, y: number, count: number, seed = 31) {
  const curl = new THREE.TorusGeometry(0.07, 0.006, 3, 10, Math.PI * 1.5);
  const im = new THREE.InstancedMesh(curl, standard('wood-wool', { color: '#e3c28f', roughness: 0.9 }), count);
  const rng = mulberry32(seed);
  const m = new THREE.Matrix4();
  const qn = new THREE.Quaternion();
  const e = new THREE.Euler();
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const p = new THREE.Vector3(range(rng, -w / 2, w / 2), y + range(rng, 0, 0.35), range(rng, -d / 2, d / 2));
    qn.setFromEuler(e.set(rng() * 6.28, rng() * 6.28, rng() * 6.28));
    const s = range(rng, 0.7, 1.6);
    im.setMatrixAt(i, m.compose(p, qn, new THREE.Vector3(s, s, s)));
    im.setColorAt(i, c.set(rng() > 0.5 ? '#e7c796' : '#d4ab72'));
  }
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = true;
  im.receiveShadow = true;
  im.name = 'wood-wool';
  return im;
}
