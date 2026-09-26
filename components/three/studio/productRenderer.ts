import * as THREE from 'three';
import type { ModelSpec } from '@/data/types';
import { createProductComposition } from '../models/composition';
import { createPiece } from '../models/registry';
import { createEnvironmentMap, SCENE_PALETTE } from '../models/environment';

/**
 * Offscreen "photo studio" that renders a product composition to a
 * transparent WebP. Used by /studio and `npm run render:products` to produce
 * the card images in /public/images/products.
 */
export class ProductRenderer {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  private readonly ground: THREE.Mesh;
  private readonly key: THREE.DirectionalLight;

  constructor(private readonly size = 900) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(size, size, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const pal = SCENE_PALETTE.light;
    this.scene.environment = createEnvironmentMap(this.renderer, 'light').texture;
    this.scene.environmentIntensity = 0.55;
    this.key = new THREE.DirectionalLight(pal.key, 1.55);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.radius = 5;
    this.key.shadow.normalBias = 0.02;
    const sc = this.key.shadow.camera;
    sc.left = -5.5;
    sc.right = 5.5;
    sc.top = 5.5;
    sc.bottom = -5.5;
    sc.near = 0.5;
    sc.far = 30;
    this.scene.add(this.key, this.key.target);
    this.scene.add(new THREE.HemisphereLight(pal.hemiSky, pal.hemiGround, 0.35));

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ color: new THREE.Color('#5c3a21'), opacity: 0.28 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  get canvas() {
    return this.renderer.domElement;
  }

  /** World-space sample points of every mesh (instances contribute their origins). */
  private samplePoints(root: THREE.Object3D, budget = 30000) {
    const pts: THREE.Vector3[] = [];
    const meshes: THREE.Mesh[] = [];
    let total = 0;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.visible) {
        meshes.push(m);
        total += (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : m.geometry.getAttribute('position').count;
      }
    });
    const stride = Math.max(1, Math.floor(total / budget));
    const tmp = new THREE.Matrix4();
    for (const m of meshes) {
      if ((m as THREE.InstancedMesh).isInstancedMesh) {
        const im = m as THREE.InstancedMesh;
        for (let i = 0; i < im.count; i += Math.max(1, Math.floor(stride / 4))) {
          im.getMatrixAt(i, tmp);
          pts.push(new THREE.Vector3().setFromMatrixPosition(tmp).applyMatrix4(im.matrixWorld));
        }
        continue;
      }
      const pos = m.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i += stride) {
        pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
      }
    }
    return pts;
  }

  /** Aims the camera from a direction and fits the projected geometry to `margin` of the frame. */
  private frame(root: THREE.Object3D, box: THREE.Box3, elevation: number, azimuth: number, margin = 0.86) {
    const pts = this.samplePoints(root);
    const dir = new THREE.Vector3(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
    );
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    let dist = radius / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const target = box.getCenter(new THREE.Vector3());
    const p = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    for (let iter = 0; iter < 6; iter++) {
      this.camera.position.copy(target).addScaledVector(dir, dist);
      this.camera.lookAt(target);
      this.camera.updateMatrixWorld();
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const c of pts) {
        p.copy(c).project(this.camera);
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const extent = Math.max(maxX - minX, maxY - minY) / 2;
      right.setFromMatrixColumn(this.camera.matrixWorld, 0);
      up.setFromMatrixColumn(this.camera.matrixWorld, 1);
      const half = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * dist;
      target.addScaledVector(right, ((maxX + minX) / 2) * half).addScaledVector(up, ((maxY + minY) / 2) * half);
      dist *= Math.pow(extent / margin, 0.85);
    }
    this.camera.position.copy(target).addScaledVector(dir, dist);
    this.camera.lookAt(target);
    this.camera.near = Math.max(0.05, dist - radius * 3);
    this.camera.far = dist + radius * 3;
    this.camera.updateProjectionMatrix();
  }

  /** `single` renders one piece on its own instead of the plated composition (handy for model work). */
  render(spec: ModelSpec, opts: { elevation?: number; azimuth?: number; margin?: number; single?: boolean } = {}) {
    const comp = opts.single ? createPiece(spec, 'high') : createProductComposition(spec, 'high');
    this.scene.add(comp);
    comp.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(comp);
    // rest on the ground plane
    comp.position.y -= box.min.y;
    comp.updateMatrixWorld(true);
    box.setFromObject(comp);
    this.ground.position.y = 0;
    const tall = spec.kind === 'utensilSet' || spec.kind === 'giftSet' || spec.kind === 'scraperBench' || spec.kind === 'scraperSeat';
    this.frame(comp, box, opts.elevation ?? (tall ? 0.5 : 0.62), opts.azimuth ?? 0.42, opts.margin ?? 0.9);
    const c = box.getCenter(new THREE.Vector3());
    this.key.position.set(c.x + 2.6, c.y + 7, c.z + 3.2);
    this.key.target.position.copy(c);
    this.renderer.render(this.scene, this.camera);
    const url = this.canvas.toDataURL('image/webp', 0.9);
    this.scene.remove(comp);
    return url;
  }

  dispose() {
    this.renderer.dispose();
  }
}
