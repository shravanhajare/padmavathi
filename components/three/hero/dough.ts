import * as THREE from 'three';
import { mulberry32, range } from '../models/noise';
import { DOUGH_R } from './choreography';

/**
 * Atta dough for the chakla: a slightly irregular ball (hand-rolled, never a
 * perfect sphere) with top-down UVs, so when it is squashed into a roti the
 * flour dusting and bran specks read correctly from above.
 */
export function createDoughGeometry() {
  const g = new THREE.SphereGeometry(DOUGH_R, 64, 40);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const rng = mulberry32(17);
  const waves = Array.from({ length: 5 }, () => [range(rng, 2, 6), rng() * Math.PI * 2, range(rng, 0.008, 0.02)] as const);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    let k = 1;
    for (const [f, ph, amp] of waves) k += (amp / DOUGH_R) * Math.sin(a * f + ph) * (1 - Math.abs(y) / DOUGH_R);
    pos.setXYZ(i, x * k, y, z * k);
    uv.setXY(i, 0.5 + x / (2.2 * DOUGH_R), 0.5 + z / (2.2 * DOUGH_R));
  }
  g.computeVertexNormals();
  g.translate(0, DOUGH_R, 0); // sits on the chakla
  return g;
}

let mat: THREE.MeshPhysicalMaterial | null = null;

export function doughMaterial() {
  if (mat) return mat;
  const size = 512;
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = color.height = bump.width = bump.height = size;
  const c = color.getContext('2d')!;
  const b = bump.getContext('2d')!;
  const rng = mulberry32(23);
  // warm atta base, a touch golden towards the edge where it is thinner
  const g = c.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.55);
  g.addColorStop(0, '#f1dcb2');
  g.addColorStop(0.8, '#ecd3a3');
  g.addColorStop(1, '#e2c28c');
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);
  // dusting of dry flour in soft patches
  for (let i = 0; i < 90; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = range(rng, 10, 60);
    const fl = c.createRadialGradient(x, y, 0, x, y, r);
    fl.addColorStop(0, `rgba(255,252,244,${range(rng, 0.25, 0.6)})`);
    fl.addColorStop(1, 'rgba(255,252,244,0)');
    c.fillStyle = fl;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // bran specks and tiny flour grains
  for (let i = 0; i < 2600; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const bran = rng() < 0.35;
    c.fillStyle = bran ? `rgba(150,105,55,${range(rng, 0.25, 0.6)})` : `rgba(255,255,250,${range(rng, 0.3, 0.8)})`;
    const s = bran ? range(rng, 0.8, 2.2) : range(rng, 0.6, 1.6);
    c.fillRect(x, y, s, s * range(rng, 0.6, 1.4));
    b.fillStyle = bran ? 'rgba(40,40,40,0.5)' : 'rgba(220,220,220,0.6)';
    b.fillRect(x, y, s, s);
  }
  // faint belan marks: long soft ridges
  for (let i = 0; i < 14; i++) {
    const y = rng() * size;
    b.strokeStyle = `rgba(${rng() > 0.5 ? '200,200,200' : '60,60,60'},0.18)`;
    b.lineWidth = range(rng, 6, 16);
    b.beginPath();
    b.moveTo(0, y);
    b.bezierCurveTo(size * 0.3, y + range(rng, -20, 20), size * 0.7, y + range(rng, -20, 20), size, y + range(rng, -10, 10));
    b.stroke();
  }
  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const bumpMap = new THREE.CanvasTexture(bump);
  mat = new THREE.MeshPhysicalMaterial({
    map,
    bumpMap,
    bumpScale: 1.2,
    roughness: 0.82,
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#fff6e4'),
  });
  mat.name = 'dough';
  return mat;
}
