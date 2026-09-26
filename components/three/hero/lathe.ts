import * as THREE from 'three';
import { barkMaterial, setWoodBlend, uniqueWoodMaterial } from '../models/wood';
import { belanProfile } from '../models/utensils';
import { MAT } from '../models/materials';
import { lathe, type Profile } from '../models/geometry';
import { mulberry32 } from '../models/noise';

/**
 * The log on the lathe. The inner wood is a live lathe mesh whose profile is
 * re-solved every frame: behind the moving tool front the radius eases from
 * the rough log to the belan profile. The bark shell is clipped away at the
 * same front, so the bark really peels off as the chisel travels. Local axis
 * is +y (the lathe axis); the group is laid along world x by its parent.
 */

const HALF = 2.0;
const LOG_R = 0.4;
const BARK_R = 0.445;

/** Resamples a lathe profile into r(y) for uniformly spaced y. */
function radiusFunction(profile: Profile) {
  const pts = profile.filter((p, i) => i === 0 || p[1] > profile[i - 1][1] - 1e-9);
  return (y: number) => {
    if (y <= pts[0][1]) return pts[0][0];
    for (let i = 1; i < pts.length; i++) {
      if (y <= pts[i][1]) {
        const [r0, y0] = pts[i - 1];
        const [r1, y1] = pts[i];
        const t = y1 - y0 < 1e-9 ? 1 : (y - y0) / (y1 - y0);
        return r0 + (r1 - r0) * t;
      }
    }
    return pts[pts.length - 1][0];
  };
}

const _tip = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _down = new THREE.Vector3(0, -1, 0);

export class CarvingLog {
  readonly object = new THREE.Group();
  /** spins about the lathe axis */
  readonly spinner = new THREE.Group();
  readonly woodMaterial: THREE.MeshPhysicalMaterial;
  readonly clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), HALF);
  private readonly wood: THREE.Mesh;
  private readonly bark: THREE.Mesh;
  private readonly geo: THREE.BufferGeometry;
  private readonly ys: Float32Array;
  private readonly rLog: Float32Array;
  private readonly rBelan: Float32Array;
  private readonly radii: Float32Array;
  private readonly cos: Float32Array;
  private readonly sin: Float32Array;
  private readonly segments: number;
  private lastFront = NaN;
  private lastFinish = NaN;
  private readonly tool: THREE.Group;
  private readonly centers: THREE.Group[] = [];

  constructor(quality: 'high' | 'low') {
    this.segments = quality === 'high' ? 72 : 40;
    const samples = quality === 'high' ? 170 : 110;
    const belanR = radiusFunction(belanProfile('classic'));
    // profile = axis point, samples along y, axis point (flat caps on the log)
    const n = samples + 2;
    this.ys = new Float32Array(n);
    this.rLog = new Float32Array(n);
    this.rBelan = new Float32Array(n);
    this.radii = new Float32Array(n);
    for (let i = 0; i < samples; i++) {
      const y = -HALF + (2 * HALF * i) / (samples - 1);
      this.ys[i + 1] = y;
      this.rLog[i + 1] = LOG_R;
      this.rBelan[i + 1] = Math.max(0.0, belanR(y));
    }
    this.ys[0] = -HALF;
    this.ys[n - 1] = HALF;
    this.cos = new Float32Array(this.segments + 1);
    this.sin = new Float32Array(this.segments + 1);
    for (let j = 0; j <= this.segments; j++) {
      const a = (j / this.segments) * Math.PI * 2;
      this.cos[j] = Math.cos(a);
      this.sin[j] = Math.sin(a);
    }
    const profile: Profile = Array.from(this.ys, (y, i) => [i === 0 || i === n - 1 ? 0 : LOG_R, y] as [number, number]);
    this.geo = lathe(profile, { segments: this.segments });
    (this.geo.getAttribute('position') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geo.getAttribute('normal') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);

    this.woodMaterial = uniqueWoodMaterial('fresh', { axis: 'y', pith: [0.12, -1.1], tilt: [0.04, 0.1], seed: 1 });
    this.wood = new THREE.Mesh(this.geo, this.woodMaterial);
    this.wood.castShadow = true;
    this.wood.receiveShadow = true;

    // bark: an irregular open shell with rims, clipped at the tool front
    const rng = mulberry32(5);
    const bumps = Array.from({ length: 7 }, () => [rng() * 6.28, 0.5 + rng() * 2.5, rng() * 0.03] as const);
    const barkProfile: Profile = [[LOG_R - 0.01, -HALF], [BARK_R, -HALF], [BARK_R, -HALF + 0.02]];
    for (let i = 1; i < 30; i++) barkProfile.push([BARK_R, -HALF + (2 * HALF * i) / 30]);
    barkProfile.push([BARK_R, HALF - 0.02], [BARK_R, HALF], [LOG_R - 0.01, HALF]);
    const barkGeo = lathe(barkProfile, {
      segments: quality === 'high' ? 56 : 32,
      radial: (theta, y, r) => {
        if (r < BARK_R - 1e-4) return 1;
        let k = 1;
        for (const [ph, f, amp] of bumps) k += amp * Math.sin(theta * 3 + ph + y * f);
        return k + 0.02 * Math.sin(theta * 17 + y * 5);
      },
    });
    const bm = barkMaterial().clone();
    bm.clippingPlanes = [this.clip];
    bm.side = THREE.DoubleSide;
    this.bark = new THREE.Mesh(barkGeo, bm);
    this.bark.castShadow = true;
    this.spinner.add(this.wood, this.bark);
    this.object.add(this.spinner);

    // lathe spur centres pressing on each end
    for (const s of [-1, 1]) {
      const c = new THREE.Group();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 20), MAT.steel());
      cone.rotation.x = s > 0 ? Math.PI : 0;
      cone.position.y = s * 0.09;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.42, 20), MAT.blackSteel());
      shaft.position.y = s * (0.18 + 0.21);
      c.add(cone, shaft);
      this.centers.push(c);
      this.object.add(c);
    }

    // the turning gouge (tip at the origin, handle along −y): steel blade, brass ferrule, turned handle
    this.tool = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.9, 12), MAT.steel());
    blade.position.y = -0.45;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 8), MAT.steelTeeth());
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.12, 16), MAT.brass());
    ferrule.position.y = -0.96;
    const handle = new THREE.Mesh(
      lathe(
        [
          [0, 0],
          ...([
            [0.07, 0.01],
            [0.095, 0.35],
            [0.085, 0.85],
            [0.064, 1.02],
          ] as Profile),
          [0, 1.04],
        ],
        { segments: 20 },
      ),
      uniqueWoodMaterial('sheesham', { axis: 'y', seed: 7 }),
    );
    handle.position.y = -2.06;
    for (const m of [blade, tip, ferrule, handle]) {
      m.castShadow = true;
      this.tool.add(m);
    }
    this.object.add(this.tool);

    this.setCarve(0, 0);
  }

  /** The world-space tip of the gouge, where shavings leave the wood. */
  readonly toolTip = new THREE.Vector3();

  /**
   * @param carve 0..1 tool travel (right end → left end)
   * @param finish 0..1 sanding & oiling (fresh wood → oiled teak)
   */
  setCarve(carve: number, finish: number) {
    const front = HALF + 0.12 - carve * (2 * HALF + 0.24);
    if (front !== this.lastFront) {
      this.lastFront = front;
      const n = this.ys.length;
      const width = 0.18;
      for (let i = 0; i < n; i++) {
        const y = this.ys[i];
        const c = THREE.MathUtils.smoothstep(y, front - width, front + width);
        this.radii[i] = i === 0 || i === n - 1 ? 0 : this.rLog[i] + (this.rBelan[i] - this.rLog[i]) * c;
      }
      this.writeGeometry();
      this.clip.constant = front;
    }
    if (finish !== this.lastFinish) {
      this.lastFinish = finish;
      setWoodBlend(this.woodMaterial, 'fresh', 'teak', finish);
    }
  }

  private writeGeometry() {
    const n = this.ys.length;
    const pos = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const nrm = this.geo.getAttribute('normal') as THREE.BufferAttribute;
    const p = pos.array as Float32Array;
    const q = nrm.array as Float32Array;
    for (let i = 0; i < n; i++) {
      const r = this.radii[i];
      const y = this.ys[i];
      // profile normal from neighbours (one-sided at the caps)
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(n - 1, i + 1);
      let tr = this.radii[i1] - this.radii[i0];
      let ty = this.ys[i1] - this.ys[i0];
      if (i === 0) {
        tr = 1;
        ty = 0;
      } else if (i === n - 1) {
        tr = -1;
        ty = 0;
      } else if (i === 1 || i === n - 2) {
        tr = 0;
        ty = 1;
      }
      const len = Math.hypot(tr, ty) || 1;
      const nr = ty / len;
      const ny = -tr / len;
      for (let j = 0; j <= this.segments; j++) {
        const k = (j * n + i) * 3;
        p[k] = r * this.sin[j];
        p[k + 1] = y;
        p[k + 2] = r * this.cos[j];
        q[k] = nr * this.sin[j];
        q[k + 1] = ny;
        q[k + 2] = nr * this.cos[j];
      }
    }
    pos.needsUpdate = true;
    nrm.needsUpdate = true;
    this.geo.computeBoundingSphere();
  }

  /**
   * @param spin radians of lathe rotation
   * @param centers 0..1 how far the spur centres are pushed in
   * @param tool 0..1 gouge visibility
   * @param carve current tool travel, to place the gouge
   */
  update(spin: number, centers: number, tool: number, carve: number) {
    this.spinner.rotation.y = spin;
    const out = (1 - centers) * 0.9;
    this.centers[0].position.y = -HALF - out;
    this.centers[1].position.y = HALF + out;
    for (const c of this.centers) c.visible = centers > 0.001;
    // tip rides the tool front on the surface, below and in front of the axis
    // (local +x maps to world down once the log is laid along world x)
    const front = HALF + 0.12 - carve * (2 * HALF + 0.24);
    const y = THREE.MathUtils.clamp(front, -HALF + 0.05, HALF - 0.05);
    const idx = Math.round(((y + HALF) / (2 * HALF)) * (this.ys.length - 3)) + 1;
    const r = this.radii[THREE.MathUtils.clamp(idx, 1, this.ys.length - 2)];
    const a = 0.75;
    _tip.set(Math.sin(a) * r, y, Math.cos(a) * r);
    _dir.set(Math.sin(a + 0.25), 0.12, Math.cos(a + 0.25)).normalize();
    this.tool.visible = tool > 0.001;
    this.tool.position.copy(_tip).addScaledVector(_dir, (1 - tool) * 3);
    this.tool.quaternion.setFromUnitVectors(_down, _dir);
    this.object.updateMatrixWorld();
    this.toolTip.copy(_tip).applyMatrix4(this.object.matrixWorld);
  }

  /** Keeps the bark's clipping plane in world space. Call after the parent moved. */
  syncClip() {
    this.bark.updateMatrixWorld();
    const local = new THREE.Plane(new THREE.Vector3(0, -1, 0), this.clip.constant);
    this.worldClip.copy(local).applyMatrix4(this.bark.matrixWorld);
    (this.bark.material as THREE.Material).clippingPlanes = [this.worldClip];
  }

  private readonly worldClip = new THREE.Plane();
}
