import * as THREE from 'three';
import type { ModelKind, ModelSpec, WoodId } from '@/data/types';
import {
  createBelan,
  createBoard,
  createChakla,
  createDabba,
  createGhotni,
  createLadle,
  createMathani,
  createMortar,
  createSpatula,
  createSpoon,
  type Quality,
} from './utensils';
import { createBenchScraper, createSeatScraper } from './scrapers';
import type { WoodOptions } from './wood';

/**
 * ─── Swapping procedural models for real GLB models ───
 * Drop a .glb into /public/models and map it here. Keys are either
 * "kind" (all variants) or "kind:variant" (one variant). Models are
 * auto-centred and scaled to the procedural model's size, so no manual
 * tuning is needed. Use the procedural axis convention: long tools along +Y
 * with the working end at the bottom.
 *
 * Example:
 *   'belan:classic': '/models/classic-belan.glb',
 *   scraperSeat: '/models/seat-scraper.glb',
 */
export const GLB_MODELS: Record<string, string> = {};

export function specKey(spec: Pick<ModelSpec, 'kind' | 'variant'>) {
  return spec.variant ? `${spec.kind}:${spec.variant}` : spec.kind;
}

export function glbUrlFor(spec: Pick<ModelSpec, 'kind' | 'variant'>): string | undefined {
  return GLB_MODELS[specKey(spec)] ?? GLB_MODELS[spec.kind];
}

type PieceBuilder = (wood: WoodId, variant: string | undefined, q: Quality, opts?: WoodOptions) => THREE.Group;

/** Single pieces (no props), used by the hero and as GLB size references. */
export const PIECE_BUILDERS: Partial<Record<ModelKind, PieceBuilder>> = {
  belan: (w, v, q, o) => createBelan(w, v, q, o),
  chakla: (w, _v, q, o) => createChakla(w, q, o),
  mathani: (w, v, q, o) => createMathani(w, v, q, o),
  ghotni: (w, _v, q, o) => createGhotni(w, q, o),
  spatula: (w, v, q, o) => createSpatula(w, v, q, o),
  ladle: (w, _v, q, o) => createLadle(w, q, o),
  spoon: (w, v, q, o) => createSpoon(w, v === 'tea6' ? 'tea' : 'serving', q, o),
  board: (w, v, q, o) => createBoard(w, v, q, o),
  dabba: (w, v, q, o) => createDabba(w, v, q, o),
  mortar: (w, v, q, o) => createMortar(w, v, q, o),
  scraperBench: (w, _v, q, o) => createBenchScraper(w, q, o),
  scraperSeat: (w, _v, q, o) => createSeatScraper(w, q, o),
};

export function createPiece(spec: ModelSpec, q: Quality = 'high', opts?: WoodOptions) {
  const build = PIECE_BUILDERS[spec.kind];
  if (!build) throw new Error(`No single-piece builder for "${spec.kind}"`);
  return build(spec.wood, spec.variant, q, opts);
}

/** Fits an arbitrary loaded model (e.g. a GLB scene) to the size and placement of a reference object. */
export function fitToReference(object: THREE.Object3D, reference: THREE.Object3D): THREE.Group {
  const group = new THREE.Group();
  const clone = object.clone(true);
  group.add(clone);
  const refBox = new THREE.Box3().setFromObject(reference);
  const refSize = refBox.getSize(new THREE.Vector3());
  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());
  const scale = Math.max(refSize.x, refSize.y, refSize.z) / Math.max(size.x, size.y, size.z, 1e-6);
  clone.scale.multiplyScalar(scale);
  const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
  const refCenter = refBox.getCenter(new THREE.Vector3());
  clone.position.copy(refCenter).sub(center);
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

const glbCache = new Map<string, Promise<THREE.Object3D | null>>();

/** Loads the mapped GLB for a spec (or null when none is mapped / it fails to load). */
export function loadGLB(spec: Pick<ModelSpec, 'kind' | 'variant'>): Promise<THREE.Object3D | null> {
  const url = glbUrlFor(spec);
  if (!url) return Promise.resolve(null);
  let pending = glbCache.get(url);
  if (!pending) {
    pending = import('three/examples/jsm/loaders/GLTFLoader.js')
      .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(url))
      .then((gltf) => gltf.scene as THREE.Object3D)
      .catch((err) => {
        console.warn(`[models] Could not load ${url}, using the procedural model.`, err);
        return null;
      });
    glbCache.set(url, pending);
  }
  return pending;
}

/** The piece for a spec: the mapped GLB fitted to the procedural size, or the procedural model. */
export async function loadPiece(spec: ModelSpec, q: Quality = 'high', opts?: WoodOptions) {
  const procedural = createPiece(spec, q, opts);
  const glb = await loadGLB(spec);
  return glb ? fitToReference(glb, procedural) : procedural;
}
