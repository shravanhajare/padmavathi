import * as THREE from 'three';

/**
 * Shared, cached materials for everything that isn't wood. Sharing means a
 * scene with thirty spoons still compiles a handful of shaders.
 */
const cache = new Map<string, THREE.Material>();

export function cachedMaterial<T extends THREE.Material>(key: string, make: () => T): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = make();
    m.name = key;
    cache.set(key, m);
  }
  return m;
}

export const physical = (key: string, params: THREE.MeshPhysicalMaterialParameters) =>
  cachedMaterial(key, () => new THREE.MeshPhysicalMaterial(params));

export const standard = (key: string, params: THREE.MeshStandardMaterialParameters) =>
  cachedMaterial(key, () => new THREE.MeshStandardMaterial(params));

export const MAT = {
  /** stainless blade and plates */
  steel: () => physical('steel', { color: '#aeb4bb', metalness: 1, roughness: 0.34, clearcoat: 0.2, clearcoatRoughness: 0.3 }),
  /** filed teeth catch the light a little more */
  steelTeeth: () => physical('steel-teeth', { color: '#c3c8ce', metalness: 1, roughness: 0.24 }),
  /** powder-coated black arm of the seat-style scraper */
  blackSteel: () => physical('black-steel', { color: '#1d1c1d', metalness: 0.55, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
  bolt: () => standard('bolt', { color: '#8d9197', metalness: 1, roughness: 0.35 }),
  nail: () => standard('nail', { color: '#3b3632', metalness: 0.8, roughness: 0.55 }),
  brass: () => standard('brass', { color: '#d9a94a', metalness: 0.95, roughness: 0.25 }),
  coconutShell: () => standard('coconut-shell', { color: '#6a4528', roughness: 0.9 }),
  coconutMeat: () => physical('coconut-meat', { color: '#fbf7ee', roughness: 0.62, sheen: 0.5, sheenColor: new THREE.Color('#ffffff') }),
  coconutFlake: () => standard('coconut-flake', { color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide }),
  flour: () => standard('flour', { color: '#fbf6ec', roughness: 1 }),
  dough: () => physical('dough', { color: '#f1dfbd', roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color('#fff4dd') }),
  twine: () => standard('twine', { color: '#b89366', roughness: 0.95 }),
  ribbon: () => physical('ribbon', { color: '#ec4899', roughness: 0.35, sheen: 1, sheenColor: new THREE.Color('#ffd1e8'), sheenRoughness: 0.3 }),
  kraft: () => standard('kraft', { color: '#d8b98c', roughness: 0.9, side: THREE.DoubleSide }),
  cardamom: () => physical('cardamom', { color: '#8aa052', roughness: 0.6, sheen: 0.3 }),
  pepper: () => standard('pepper', { color: '#2b2019', roughness: 0.8 }),
  clay: () => standard('clay', { color: '#b8603a', roughness: 0.85 }),
  shelfBracket: () => physical('bracket', { color: '#2a211b', metalness: 0.6, roughness: 0.45 }),
};

/** Ground spice colours for the masala dabba bowls. */
export const SPICES: Array<{ name: string; color: string; grain: 'powder' | 'seed' }> = [
  { name: 'haldi', color: '#e9a31b', grain: 'powder' },
  { name: 'mirchi', color: '#b3261e', grain: 'powder' },
  { name: 'rai', color: '#3a2618', grain: 'seed' },
  { name: 'jeera', color: '#8a6a44', grain: 'seed' },
  { name: 'dhania', color: '#9c7b45', grain: 'powder' },
  { name: 'methi', color: '#c39a3a', grain: 'seed' },
  { name: 'garam', color: '#6b3f25', grain: 'powder' },
];

export function spiceMaterial(color: string, grain: 'powder' | 'seed') {
  return physical(`spice-${color}`, { color, roughness: grain === 'powder' ? 0.95 : 0.7, sheen: grain === 'powder' ? 0.6 : 0.2 });
}
