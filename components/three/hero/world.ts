import * as THREE from 'three';
import type { PerfTier } from '@/lib/device';
import { CarvingLog } from './lathe';
import { Backdrop, createFlakes, createShavings, DustMotes, FlourPuff, type Emitter } from './effects';
import { TIMELINE, FLOOR, REST, BELAN_R, CHAKLA_TOP, DOUGH_R, bump, doughHeightAt, doughRadius, ease, seg, type StageLayout } from './choreography';
import { createDoughGeometry, doughMaterial } from './dough';
import {
  CHAKLA,
  createChakla,
  createCoconutHalf,
  createCoconutHeap,
  createDabba,
  createDabbaLid,
  createGhotni,
  createLadle,
  createMathani,
  createMortar,
  createPestle,
  createSpatula,
  createSpoon,
  mesh,
  type Quality,
} from '../models/utensils';
import { createSeatScraper, seatCoconut, type CoconutSeat } from '../models/scrapers';
import { rimBelow } from '../models/composition';
import { createCrate, type CrateParts } from '../models/crate';
import { woodMaterial } from '../models/wood';
import { MAT } from '../models/materials';
import { createRadialTexture } from '../models/textures';
import { roundedBox } from '../models/geometry';
import { SCENE_PALETTE, type SceneTheme } from '../models/environment';

// scratch objects (no allocation per frame)
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _orbit = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);

interface Palette {
  bgTop: THREE.Color;
  bgBottom: THREE.Color;
  bgGlow: THREE.Color;
  bgRay: THREE.Color;
  key: THREE.Color;
  rim: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  glow: THREE.Color;
  mote: THREE.Color;
  keyIntensity: number;
  rimIntensity: number;
  hemiIntensity: number;
}

function paletteFor(theme: SceneTheme): Palette {
  const p = SCENE_PALETTE[theme];
  return {
    bgTop: new THREE.Color(p.bgTop),
    bgBottom: new THREE.Color(p.bgBottom),
    bgGlow: new THREE.Color(p.bgGlow),
    bgRay: new THREE.Color(p.bgRay),
    key: new THREE.Color(p.key),
    rim: new THREE.Color(p.rim),
    hemiSky: new THREE.Color(p.hemiSky),
    hemiGround: new THREE.Color(p.hemiGround),
    glow: new THREE.Color(p.glow),
    mote: new THREE.Color(theme === 'light' ? '#ffd996' : '#ffb3d6'),
    keyIntensity: p.keyIntensity * 0.7,
    rimIntensity: p.rimIntensity * 0.8,
    hemiIntensity: p.hemiIntensity * 0.85,
  };
}

interface Utensil {
  root: THREE.Group;
  /** half the tool's length (its centroid sits at the middle) */
  half: number;
  index: number;
  start: THREE.Vector3;
  restPos: THREE.Vector3;
  restQ: THREE.Quaternion;
  phase: number;
}

export interface HeroWorldOptions {
  tier: PerfTier;
}

export class HeroWorld {
  readonly root = new THREE.Group();
  readonly stage = new THREE.Group();
  readonly focus = new THREE.Vector3(0, 0, 0);
  readonly backdrop = new Backdrop();
  private readonly key = new THREE.DirectionalLight('#fff1dc', 1.6);
  private readonly rim = new THREE.DirectionalLight('#ffc3d6', 0.8);
  private readonly hemi = new THREE.HemisphereLight('#fff6ea', '#e9b9a0', 0.3);
  private readonly glowLight = new THREE.PointLight('#ffc766', 0, 9, 2);
  private readonly motes: DustMotes;

  private readonly logRig = new THREE.Group();
  private readonly log: CarvingLog;
  private readonly chakla: THREE.Group;
  private readonly roti: THREE.Mesh;
  private readonly flour = new FlourPuff();
  private readonly crate: CrateParts;
  private readonly utensils: Utensil[] = [];
  private readonly scraper = new THREE.Group();
  private readonly scraperBody: THREE.Group;
  private readonly heap: THREE.InstancedMesh;
  private readonly coconut: THREE.Group;
  private readonly coconutSeat: THREE.Vector3;
  private readonly coconutFacing: THREE.Vector3;
  private readonly coconutBase: THREE.Quaternion;
  private readonly grateFrom: THREE.Vector3;
  private readonly counter = new THREE.Group();
  private readonly shavings: Emitter;
  private readonly flakes: Emitter;

  private pal: Palette = paletteFor('light');
  private target: Palette = paletteFor('light');
  private readonly camPos = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly parallax = new THREE.Vector2();
  private spin = 0;
  private lastP = 0;

  constructor(private readonly opts: HeroWorldOptions) {
    const { tier } = opts;
    const q: Quality = tier === 'high' ? 'high' : 'low';
    this.root.add(this.stage, this.backdrop.object);
    this.key.position.set(4, 7, 6);
    this.rim.position.set(-6, 3.5, -5);
    this.root.add(this.key, this.key.target, this.rim, this.hemi);
    this.stage.add(this.glowLight);
    this.motes = new DustMotes(tier === 'low' ? 60 : tier === 'medium' ? 130 : 220);
    this.root.add(this.motes.object);

    // ── log → belan on the lathe
    this.log = new CarvingLog(q);
    const laid = new THREE.Group();
    laid.rotation.z = -Math.PI / 2; // lathe axis (local y) along world x
    laid.add(this.log.object);
    this.logRig.add(laid);
    this.stage.add(this.logRig);

    // ── chakla, dough and flour
    this.chakla = createChakla('teak', q, { seed: 3 });
    this.stage.add(this.chakla);
    this.roti = mesh(createDoughGeometry(), doughMaterial(), 'roti');
    this.chakla.add(this.roti);
    this.roti.position.y = CHAKLA.top;
    this.flour.object.position.set(0, CHAKLA.top + 0.05, 0);
    this.chakla.add(this.flour.object);

    // ── crate and the utensils that fly out of it
    this.crate = createCrate({ q, filled: true });
    this.stage.add(this.crate.root);
    const tools: Array<[THREE.Group, number]> = [
      [createSpatula('neem', 'flat', q, { seed: 1 }), 3.0],
      [createLadle('neem', q, { seed: 2 }), 3.1],
      [createMathani('neem', 'classic', q, { seed: 3 }), 3.0],
      [createSpoon('teak', 'serving', q, { seed: 4 }), 2.4],
      [createSpatula('acacia', 'slotted', q, { seed: 5 }), 3.0],
      [createGhotni('acacia', q, { seed: 6 }), 2.75],
    ];
    // resting slots inside the crate in the finale (crate-local), leaning outward
    const slots: Array<[number, number, number, number]> = [
      [-1.1, -0.55, -0.35, 0.25],
      [-0.4, -0.7, -0.1, 0.2],
      [0.35, -0.6, 0.12, 0.22],
      [1.05, -0.45, 0.32, 0.2],
      [-0.75, 0.35, -0.25, -0.1],
      [0.7, 0.4, 0.25, -0.12],
    ];
    this.crate.root.scale.setScalar(REST.crateScale);
    const crateRestQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, REST.crateYaw, 0));
    const crateRest = new THREE.Matrix4().compose(new THREE.Vector3(...REST.crate), crateRestQ, new THREE.Vector3().setScalar(REST.crateScale));
    tools.forEach(([tool, len], i) => {
      const root = new THREE.Group();
      tool.position.y = -len / 2; // centroid at the root's origin
      root.add(tool);
      this.stage.add(root);
      const [sx, sz, lean, leanZ] = slots[i];
      // tool axis (+y from head to handle) points down and slightly inward, head up
      const up = new THREE.Vector3(lean, 1, leanZ).normalize();
      const restQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), up);
      restQ.premultiply(crateRestQ);
      const base = new THREE.Vector3(sx, this.crate.floorY + 0.25, sz);
      const restPos = base.applyMatrix4(crateRest).addScaledVector(up.clone().applyQuaternion(crateRestQ), len / 2);
      this.utensils.push({
        root,
        half: len / 2,
        index: i,
        start: new THREE.Vector3(sx * 0.6, this.crate.floorY + len / 2 - 0.6, sz * 0.6),
        restPos,
        restQ,
        phase: i * 1.37,
      });
    });

    // ── seat-style coconut scraper with a coconut and a growing heap of gratings
    this.scraperBody = createSeatScraper('acacia', q);
    this.scraper.add(this.scraperBody);
    // the half coconut is held on the blade (teeth inside the shell, against the meat) and turned as it grates
    this.coconut = seatCoconut(this.scraperBody, createCoconutHalf(q));
    this.coconutSeat = this.coconut.position.clone();
    this.coconutFacing = (this.scraperBody.userData.coconut as CoconutSeat).facing.clone();
    this.coconutBase = this.coconut.quaternion.clone();
    this.scraper.add(this.coconut);
    this.grateFrom = rimBelow(this.scraperBody);
    this.heap = createCoconutHeap(tier === 'low' ? 180 : 380, 0.42, 0.2, 5);
    this.heap.position.set(this.grateFrom.x, 0.2, this.grateFrom.z);
    this.scraper.add(this.heap);
    // its own soft ground shadow (the contact shadows sit this chapter out)
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 2.8),
      new THREE.MeshBasicMaterial({
        map: createRadialTexture([
          [0, 'rgba(70,40,20,0.42)'],
          [0.55, 'rgba(70,40,20,0.2)'],
          [1, 'rgba(70,40,20,0)'],
        ]),
        transparent: true,
        depthWrite: false,
      }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(0.1, 0.004, 0);
    blob.renderOrder = -1;
    this.scraper.add(blob);
    this.stage.add(this.scraper);

    // ── the counter the finale settles onto, with a mortar and a spice box already on it
    const slab = mesh(roundedBox(9.2, 0.38, 5.0, 0.06), woodMaterial('pale', { axis: 'x', pith: [-2.4, 0.4], seed: 21 }), 'counter');
    slab.position.y = -0.19;
    slab.receiveShadow = true;
    this.counter.add(slab);
    const mortar = createMortar('sheesham', 'classic', q);
    mortar.position.set(0.75, 0, 1.55);
    const pestle = createPestle('sheesham', 'classic', q);
    pestle.rotation.set(0, 0, 0.62);
    pestle.position.set(0.8, 0.38, 1.55);
    const dabba = createDabba('sheesham', 'seven', q);
    dabba.scale.setScalar(0.8);
    dabba.position.set(-2.6, 0, -1.4);
    const lid = createDabbaLid('sheesham', 'seven', q);
    lid.scale.setScalar(0.8);
    lid.position.set(-2.6, 0.72 * 0.8, -1.4);
    this.counter.add(mortar, pestle, dabba, lid);
    this.stage.add(this.counter);

    // ── particles
    this.shavings = createShavings(tier === 'high' ? 240 : tier === 'medium' ? 150 : 70);
    this.flakes = createFlakes(tier === 'high' ? 320 : tier === 'medium' ? 200 : 90);
    this.stage.add(this.shavings.mesh, this.flakes.mesh);
  }

  /** Cross-fades lights and backdrop to a theme; `snap` applies it immediately. */
  setTheme(theme: SceneTheme, snap = false) {
    this.target = paletteFor(theme);
    if (snap) this.lerpPalette(1);
  }

  private lerpPalette(k: number) {
    const p = this.pal;
    const t = this.target;
    (['bgTop', 'bgBottom', 'bgGlow', 'bgRay', 'key', 'rim', 'hemiSky', 'hemiGround', 'glow', 'mote'] as const).forEach((c) => p[c].lerp(t[c], k));
    p.keyIntensity += (t.keyIntensity - p.keyIntensity) * k;
    p.rimIntensity += (t.rimIntensity - p.rimIntensity) * k;
    p.hemiIntensity += (t.hemiIntensity - p.hemiIntensity) * k;
    const u = this.backdrop.uniforms;
    u.uTop.value.copy(p.bgTop);
    u.uBottom.value.copy(p.bgBottom);
    u.uGlow.value.copy(p.bgGlow);
    u.uRay.value.copy(p.bgRay);
    this.key.color.copy(p.key);
    this.key.intensity = p.keyIntensity;
    this.rim.color.copy(p.rim);
    this.rim.intensity = p.rimIntensity;
    this.hemi.color.copy(p.hemiSky);
    this.hemi.groundColor.copy(p.hemiGround);
    this.hemi.intensity = p.hemiIntensity;
    this.glowLight.color.copy(p.glow);
  }

  private updateLog(p: number, time: number, dt: number, arrive: number) {
    const T = TIMELINE.log;
    T.pos(p, _v);
    T.rot(p, _v2);
    const floating = 1 - seg(p, 0.08, 0.12);
    const bob = Math.sin(time * 1.1) * 0.07 * floating;
    this.logRig.position.set(_v.x, _v.y + bob - (1 - ease.out(arrive)) * 0.8, _v.z);
    this.logRig.rotation.set(_v2.x + Math.sin(time * 0.6) * 0.04 * floating, _v2.y + Math.sin(time * 0.4) * 0.12 * floating, _v2.z);
    this.logRig.scale.setScalar(0.85 + 0.15 * ease.backOut(arrive));

    // rolling on the chakla: move across the belan's own axis and turn with it
    const roll = T.roll(p);
    this.logRig.updateMatrix();
    _v.set(0, 0, 1).applyQuaternion(this.logRig.quaternion);
    this.logRig.position.addScaledVector(_v, roll);
    // once over the chakla, the belan rests on the dough, never through it
    if (p > 0.4) {
      TIMELINE.chakla.pos(p, _v2);
      const rest = _v2.y + CHAKLA_TOP + doughHeightAt(p, Math.abs(roll)) + BELAN_R;
      if (this.logRig.position.y < rest) this.logRig.position.y = rest;
    }

    // lathe speed is time-driven; direction follows the scroll so reversing feels right
    const speed = T.spin(p);
    const dir = p >= this.lastP ? 1 : -1;
    this.spin += speed * dt * (speed > 1 ? dir : 1);
    const carve = T.carve(p);
    this.log.setCarve(carve, T.finish(p));
    this.log.update(this.spin + roll / 0.238, T.centers(p), T.tool(p), carve);
    this.logRig.updateMatrixWorld();
    this.log.syncClip();
  }

  private updateChakla(p: number) {
    const T = TIMELINE.chakla;
    T.pos(p, _v);
    T.rot(p, _v2);
    this.chakla.position.copy(_v);
    this.chakla.rotation.set(_v2.x, _v2.y, _v2.z);
    this.chakla.visible = p > 0.335;
    const show = TIMELINE.roti.show(p);
    const h = TIMELINE.roti.height(p);
    this.roti.visible = show > 0.001;
    const s = ease.backOut(show);
    // volume-preserving squash: the ball presses flat under the belan and spreads as it is rolled
    const xz = doughRadius(h) / DOUGH_R;
    this.roti.scale.set(s * xz, s * (h / (2 * DOUGH_R)), s * xz);
    this.flour.update(seg(p, TIMELINE.flour[0], TIMELINE.flour[1]));
  }

  private updateCrate(p: number, time: number) {
    const T = TIMELINE.crate;
    const root = this.crate.root;
    T.pos(p, _v);
    T.rot(p, _v2);
    root.position.copy(_v);
    root.position.y += Math.sin(time * 0.9) * 0.03 * bump(p, 0.545, 0.645);
    root.rotation.set(_v2.x, _v2.y, _v2.z);
    root.visible = p > 0.485;
    this.crate.lid.rotation.x = -T.lid(p) * 2.15;
    root.updateMatrixWorld();
  }

  private updateUtensils(p: number, time: number) {
    const [r0, rStep, rDur] = TIMELINE.crate.rise;
    const [l0, lStep, lDur] = TIMELINE.crate.land;
    const crate = this.crate.root;
    // the orbit follows the crate; it tightens while the crate is parked
    const park = seg(p, 0.655, 0.715) * (1 - seg(p, 0.84, 0.9));
    const center = _v.copy(crate.position).add(_v2.set(0, 2.75 - park * 0.8, 0));
    const radius = 2.05 * (1 - park * 0.35);
    for (const u of this.utensils) {
      const rise = ease.out(seg(p, r0 + u.index * rStep, r0 + u.index * rStep + rDur));
      const land = ease.inOut(seg(p, l0 + u.index * lStep, l0 + u.index * lStep + lDur));
      const root = u.root;
      root.visible = rise > 0.001;
      if (!root.visible) continue;
      const theta = (u.index / this.utensils.length) * Math.PI * 2 + time * 0.22 + p * 7;
      // helix: out of the crate, spiralling up and around
      const orbitR = radius * rise;
      const orbit = _orbit.set(
        Math.cos(theta) * orbitR,
        -2.2 + rise * (2.0 + Math.sin(time * 0.8 + u.phase) * 0.18 + (u.index % 2) * 0.45),
        Math.sin(theta) * orbitR * 0.7 + 0.6 * rise,
      ).add(center);
      _v2.copy(u.start).applyMatrix4(crate.matrix);
      const pos = _v2.lerp(orbit, rise);
      // heads up, tilted outward, slowly turning
      _q.setFromEuler(_e.set(0, -theta + Math.PI / 2, 0));
      _q2.setFromAxisAngle(X, Math.PI + (0.35 + Math.sin(time + u.phase) * 0.1) * rise);
      _q.multiply(_q2);
      _q2.setFromAxisAngle(UP, time * 0.5 + u.phase);
      _q.multiply(_q2);
      if (rise < 1) {
        // start standing straight in the crate
        const start = _q2.setFromAxisAngle(X, Math.PI).premultiply(crate.quaternion);
        _q.slerp(start, 1 - rise);
      }
      if (land > 0) {
        pos.lerp(u.restPos, land);
        pos.y += Math.sin(Math.PI * land) * 1.2;
        _q.slerp(u.restQ, land);
      }
      root.position.copy(pos);
      root.quaternion.copy(_q);
      // a little smaller while flying so the orbit reads clearly; full size once landed
      root.scale.setScalar((0.4 + 0.6 * Math.min(1, rise * 1.4)) * (0.8 + 0.2 * land));
    }
  }

  private updateScraper(p: number, dt: number, scroll: number) {
    const T = TIMELINE.scraper;
    T.pos(p, _v);
    this.scraper.position.copy(_v);
    // a slow scroll-driven turntable while it is centre stage
    const centre = bump(p, 0.7, 0.86);
    this.scraper.rotation.set(0, T.yaw(p) + (seg(p, 0.715, 0.84) - 0.5) * 1.1 * centre, 0);
    this.scraper.visible = p > 0.64;
    const grate = seg(p, T.flakes[0], T.flakes[1]);
    this.heap.scale.setScalar(0.25 + 0.75 * ease.out(grate));
    this.heap.visible = grate > 0;
    // the coconut comes in from the seat, settles on the blade, then turns as it is grated
    const approach = ease.out(seg(p, 0.7, T.flakes[0]));
    this.coconut.position.copy(this.coconutSeat).addScaledVector(this.coconutFacing, (1 - approach) * 1.3);
    this.coconut.quaternion.copy(this.coconutBase).multiply(_q.setFromAxisAngle(UP, grate * Math.PI * 5 + 0.4));
    this.coconut.visible = approach > 0.001;
    this.scraper.updateMatrixWorld();
    // grated coconut falls out of the lower rim, where the teeth bite into the meat
    const active = p > T.flakes[0] && p < T.flakes[1];
    if (active) {
      const from = _v.copy(this.grateFrom);
      this.scraperBody.localToWorld(from);
      this.stage.worldToLocal(from);
      this.flakes.emit(from, 55 + Math.min(260, scroll * 5200), dt, (rng, out) => out.set((rng() - 0.5) * 0.6, rng() * 0.3, (rng() - 0.5) * 0.6), 0.18);
    }
  }

  update(
    p: number,
    time: number,
    dt: number,
    arrive: number,
    layout: StageLayout,
    camera: THREE.PerspectiveCamera,
    pointer: { x: number; y: number },
    pixelRatio: number,
  ) {
    this.lerpPalette(1 - Math.exp(-dt * 3.5));
    this.backdrop.uniforms.uTime.value = time;
    this.motes.update(time, pixelRatio, this.pal.mote, 0.75);

    // the finale needs more room: centre the stage a little and ease it back
    const finale = seg(p, 0.84, 0.93);
    const sx = layout.portrait ? layout.x - 0.6 * layout.scale * finale : THREE.MathUtils.lerp(layout.x, layout.x * 0.5 + 0.75, finale);
    const sc = layout.scale * (1 - (layout.portrait ? 0.22 : 0.14) * finale);
    this.stage.position.set(sx, layout.y, 0);
    this.stage.scale.setScalar(sc);
    this.stage.updateMatrixWorld();

    const scroll = Math.abs(p - this.lastP) / Math.max(dt, 1e-3);
    this.updateLog(p, time, dt, arrive);
    this.updateChakla(p);
    this.updateCrate(p, time);
    this.updateUtensils(p, time);
    this.updateScraper(p, dt, scroll);

    TIMELINE.counter(p, this.counter.position);
    this.counter.visible = p > 0.82;

    // shavings fly off the gouge while it cuts
    const cutting = p > 0.14 && p < 0.3 && TIMELINE.log.tool(p) > 0.9;
    if (cutting) {
      const tip = _v.copy(this.log.toolTip);
      this.stage.worldToLocal(tip);
      this.shavings.emit(tip, 26 + Math.min(220, scroll * 3200), dt, (rng, out) =>
        out.set((rng() - 0.5) * 2.4, 1.6 + rng() * 2.6, 1.2 + rng() * 2.2),
      );
    }
    if (p < 0.1 || p > 0.36) this.shavings.clear();
    if (p < 0.7 || p > 0.86) this.flakes.clear();
    this.shavings.update(dt, FLOOR);
    this.flakes.update(dt, FLOOR + 0.2);

    // a warm light that follows the action
    const f = this.focusTarget(p, _v);
    this.glowLight.position.copy(f).add(_v2.set(0.8, 1.6, 2.2));
    this.glowLight.intensity = 4 + 3 * bump(p, 0.12, 0.34);

    // camera: dolly per chapter + pointer parallax
    TIMELINE.camera(p, this.camPos);
    TIMELINE.look(p, this.look);
    const k = 1 - Math.exp(-dt * 3);
    this.parallax.x += (pointer.x - this.parallax.x) * k;
    this.parallax.y += (pointer.y - this.parallax.y) * k;
    camera.position.set(this.camPos.x + this.parallax.x * 0.5, this.camPos.y + this.parallax.y * 0.3, this.camPos.z);
    camera.lookAt(this.look.x + this.parallax.x * 0.12, this.look.y + this.parallax.y * 0.06, this.look.z);

    // depth of field target (world space)
    _v.copy(f);
    this.stage.localToWorld(_v);
    this.focus.lerp(_v, 1 - Math.exp(-dt * 2.5));
    this.lastP = p;
  }

  /** The stage-space point the camera's attention is on. */
  private focusTarget(p: number, out: THREE.Vector3) {
    let id: (typeof TIMELINE.focus)[number][1] = 'log';
    for (const [at, name] of TIMELINE.focus) if (p >= at) id = name;
    if (id === 'log') return out.copy(this.logRig.position);
    if (id === 'chakla') return out.copy(this.chakla.position).add(_v2.set(0, 0.6, 0));
    if (id === 'crate') return out.copy(this.crate.root.position).add(_v2.set(0, 1.4, 0));
    if (id === 'scraper') return out.copy(this.scraper.position).add(_v2.set(0.2, 1.0, 0));
    return out.set(0.2, FLOOR + 0.8, 0);
  }
}
