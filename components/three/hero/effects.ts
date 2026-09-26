import * as THREE from 'three';
import { mulberry32, range } from '../models/noise';
import { coconutFlakeGeometry } from '../models/utensils';
import { createPuffTexture } from '../models/textures';

/**
 * Plain three.js effect systems for the hero. Each exposes `object` to add to
 * the scene and an `update()`.
 */

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);

// ───────────────────────── wood shaving geometry ─────────────────────────

let shavingGeo: THREE.BufferGeometry | null = null;

/** A thin ribbon wound into a loose, tapering helix: a curl off the lathe. */
export function shavingGeometry() {
  if (shavingGeo) return shavingGeo;
  const steps = 26;
  const pos: number[] = [];
  const idx: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 2.8;
    const r = 0.09 * (1 - 0.55 * t);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = t * 0.08;
    const w = 0.026 * (1 - 0.3 * t);
    pos.push(x, y - w / 2, z, x, y + w / 2, z);
    uv.push(t, 0, t, 1);
    if (i < steps) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  shavingGeo = g;
  return g;
}

// ───────────────────────── realtime particles ─────────────────────────

export interface EmitterOptions {
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  palette: string[];
  size: [number, number];
  life: [number, number];
  gravity: number;
  drag: number;
  seed?: number;
}

/**
 * A pool of instanced particles simulated in real time (shavings flung off
 * the lathe, grated coconut falling from the blade). `emit()` spawns from a
 * point; dead instances collapse to zero scale.
 */
export class Emitter {
  readonly mesh: THREE.InstancedMesh;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly rot: Float32Array;
  private readonly spin: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly size: Float32Array;
  private next = 0;
  private alive = 0;
  private readonly rng: () => number;
  private carry = 0;

  constructor(private readonly o: EmitterOptions) {
    const n = o.count;
    this.mesh = new THREE.InstancedMesh(o.geometry, o.material, n);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.rot = new Float32Array(n * 3);
    this.spin = new Float32Array(n * 3);
    this.age = new Float32Array(n).fill(1e9);
    this.life = new Float32Array(n).fill(1);
    this.size = new Float32Array(n);
    this.rng = mulberry32(o.seed ?? 7);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      this.mesh.setMatrixAt(i, _zero);
      this.mesh.setColorAt(i, c.set(o.palette[Math.floor(this.rng() * o.palette.length)]));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  /**
   * Spawns `rate * dt` particles (fractional rates carry over between frames).
   * `velocity(rng, out)` writes the initial velocity.
   */
  emit(origin: THREE.Vector3, rate: number, dt: number, velocity: (rng: () => number, out: THREE.Vector3) => void, spread = 0.03) {
    this.carry += rate * dt;
    const v = _p;
    while (this.carry >= 1) {
      this.carry -= 1;
      const i = this.next;
      this.next = (this.next + 1) % this.o.count;
      const k = i * 3;
      this.pos[k] = origin.x + range(this.rng, -spread, spread);
      this.pos[k + 1] = origin.y + range(this.rng, -spread, spread);
      this.pos[k + 2] = origin.z + range(this.rng, -spread, spread);
      velocity(this.rng, v);
      this.vel[k] = v.x;
      this.vel[k + 1] = v.y;
      this.vel[k + 2] = v.z;
      for (let a = 0; a < 3; a++) {
        this.rot[k + a] = this.rng() * Math.PI * 2;
        this.spin[k + a] = range(this.rng, -9, 9);
      }
      this.age[i] = 0;
      this.life[i] = range(this.rng, this.o.life[0], this.o.life[1]);
      this.size[i] = range(this.rng, this.o.size[0], this.o.size[1]);
    }
  }

  /** Clears every particle (e.g. when the user scrolls back past the chapter). */
  clear() {
    this.age.fill(1e9);
    this.carry = 0;
  }

  update(dt: number, floorY: number) {
    const n = this.o.count;
    const drag = Math.exp(-this.o.drag * dt);
    let alive = 0;
    for (let i = 0; i < n; i++) {
      const life = this.life[i];
      if (this.age[i] >= life) {
        if (this.age[i] < 1e8) {
          this.mesh.setMatrixAt(i, _zero);
          this.age[i] = 1e9;
        }
        continue;
      }
      alive++;
      this.age[i] += dt;
      const k = i * 3;
      this.vel[k] *= drag;
      this.vel[k + 2] *= drag;
      this.vel[k + 1] = this.vel[k + 1] * drag + this.o.gravity * dt;
      this.pos[k] += this.vel[k] * dt;
      this.pos[k + 1] += this.vel[k + 1] * dt;
      this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.pos[k + 1] < floorY) {
        // settle on the floor
        this.pos[k + 1] = floorY;
        this.vel[k] *= 0.3;
        this.vel[k + 1] = 0;
        this.vel[k + 2] *= 0.3;
        this.spin[k] *= 0.5;
        this.spin[k + 1] *= 0.5;
        this.spin[k + 2] *= 0.5;
      }
      for (let a = 0; a < 3; a++) this.rot[k + a] += this.spin[k + a] * dt;
      const t = this.age[i] / life;
      const s = this.size[i] * Math.min(1, t * 10) * (1 - THREE.MathUtils.smoothstep(t, 0.8, 1));
      _q.setFromEuler(_e.set(this.rot[k], this.rot[k + 1], this.rot[k + 2]));
      _s.set(s, s, s);
      this.mesh.setMatrixAt(i, _m.compose(_p.set(this.pos[k], this.pos[k + 1], this.pos[k + 2]), _q, _s));
    }
    this.alive = alive;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.visible = alive > 0;
  }
}

export function createShavings(count: number) {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75, side: THREE.DoubleSide });
  return new Emitter({
    count,
    geometry: shavingGeometry(),
    material: mat,
    palette: ['#f2d3a0', '#e8c089', '#dcae74', '#f6dfb7', '#d19c62'],
    size: [0.8, 1.6],
    life: [1.3, 2.2],
    gravity: -7,
    drag: 1.1,
    seed: 3,
  });
}

export function createFlakes(count: number) {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide });
  return new Emitter({
    count,
    geometry: coconutFlakeGeometry(),
    material: mat,
    palette: ['#fffdf6', '#fbf5e6', '#f3e8d0', '#ffffff'],
    size: [1.6, 2.6],
    life: [1.2, 1.9],
    gravity: -5,
    drag: 1.6,
    seed: 9,
  });
}

// ───────────────────────── flour puff ─────────────────────────

/** A soft burst of flour when the belan lands on the chakla (a pure function of progress). */
export class FlourPuff {
  readonly object: THREE.Points;
  private readonly base: Float32Array;
  private readonly dirs: Float32Array;
  private readonly material: THREE.PointsMaterial;

  constructor(count = 70) {
    const rng = mulberry32(12);
    const geo = new THREE.BufferGeometry();
    this.base = new Float32Array(count * 3);
    this.dirs = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const up = range(rng, 0.02, 0.35);
      const r = range(rng, 0.6, 1.7);
      this.dirs.set([Math.cos(a) * r, up, Math.sin(a) * r], i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.material = new THREE.PointsMaterial({
      map: createPuffTexture(),
      color: '#fffaf0',
      size: 0.9,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      sizeAttenuation: true,
    });
    this.object = new THREE.Points(geo, this.material);
    this.object.frustumCulled = false;
  }

  /** @param t 0..1 through the puff */
  update(t: number) {
    this.object.visible = t > 0 && t < 1;
    if (!this.object.visible) return;
    const pos = this.object.geometry.getAttribute('position') as THREE.BufferAttribute;
    const k = 1 - Math.pow(1 - t, 3);
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, this.dirs[i * 3] * k, this.dirs[i * 3 + 1] * k + t * 0.25, this.dirs[i * 3 + 2] * k);
    }
    pos.needsUpdate = true;
    this.material.opacity = Math.sin(Math.PI * Math.min(1, t * 1.3)) * 0.5;
    this.material.size = 0.35 + t * 0.8;
  }
}

// ───────────────────────── sawdust motes in the light ─────────────────────────

const moteVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute vec4 aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.05 + aSeed.x * 0.08);
    p.x += sin(t * 2.0 + aSeed.w * 30.0) * 0.6 + t * 0.4;
    p.y += fract(aSeed.y + t * 0.18) * 6.0 - 3.0;
    p.z += cos(t * 1.7 + aSeed.z * 20.0) * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float life = fract(aSeed.y + t * 0.18);
    vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.8, 1.0, life)) * (0.4 + 0.6 * sin(uTime * (1.0 + aSeed.z * 2.0) + aSeed.w * 12.0) * 0.5 + 0.3);
    gl_PointSize = uSize * (0.4 + aSeed.x) * uPixelRatio / max(0.001, -mv.z);
  }
`;

const moteFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAmount;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.1, 0.5, d)) * vAlpha * uAmount;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * a, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class DustMotes {
  readonly object: THREE.Points;
  readonly material: THREE.ShaderMaterial;

  constructor(count: number) {
    const rng = mulberry32(21);
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos.set([range(rng, -7, 7), range(rng, -1, 1), range(rng, -5, 3)], i * 3);
      seeds.set([rng(), rng(), rng(), rng()], i * 4);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    this.material = new THREE.ShaderMaterial({
      vertexShader: moteVert,
      fragmentShader: moteFrag,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: 55 },
        uColor: { value: new THREE.Color('#ffe2a8') },
        uAmount: { value: 0.8 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.object = new THREE.Points(geo, this.material);
    this.object.frustumCulled = false;
  }

  update(time: number, pixelRatio: number, color: THREE.Color, amount: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uPixelRatio.value = pixelRatio;
    this.material.uniforms.uColor.value.copy(color);
    this.material.uniforms.uAmount.value = amount;
  }
}

// ───────────────────────── backdrop ─────────────────────────

const backdropFrag = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlow;
  uniform vec3 uRay;
  uniform vec2 uGlowPos;
  uniform float uRayStrength;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec3 col = mix(uBottom, uTop, smoothstep(0.05, 0.95, vUv.y));
    float g = 1.0 - smoothstep(0.0, 0.55, distance(vUv * vec2(1.8, 1.0), uGlowPos * vec2(1.8, 1.0)));
    col = mix(col, uGlow, g * 0.75);
    // slanted shafts of window light
    float x = vUv.x * 1.3 + vUv.y * 0.9;
    float r = sin(x * 9.0 + uTime * 0.05) * 0.5 + 0.5;
    r *= sin(x * 3.7 - uTime * 0.03) * 0.5 + 0.5;
    r = smoothstep(0.45, 1.0, r) * smoothstep(0.2, 1.0, vUv.y) * (1.0 - smoothstep(0.6, 1.0, vUv.x));
    col = mix(col, uRay, r * uRayStrength);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class Backdrop {
  readonly object: THREE.Mesh;
  readonly uniforms: {
    uTop: { value: THREE.Color };
    uBottom: { value: THREE.Color };
    uGlow: { value: THREE.Color };
    uRay: { value: THREE.Color };
    uGlowPos: { value: THREE.Vector2 };
    uRayStrength: { value: number };
    uTime: { value: number };
  };
  constructor() {
    this.uniforms = {
      uTop: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uRay: { value: new THREE.Color() },
      uGlowPos: { value: new THREE.Vector2(0.62, 0.55) },
      uRayStrength: { value: 0.45 },
      uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: backdropFrag,
      uniforms: this.uniforms,
      depthWrite: false,
    });
    this.object = new THREE.Mesh(new THREE.PlaneGeometry(100, 50), mat);
    this.object.position.set(0, 2, -18);
    this.object.renderOrder = -10;
  }
}
