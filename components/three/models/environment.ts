import * as THREE from 'three';

export type SceneTheme = 'light' | 'dark';

/** Colours for backdrops, lights and shadows per site theme. */
export const SCENE_PALETTE = {
  light: {
    bgTop: '#f9dcbd',
    bgBottom: '#fff6e6',
    bgGlow: '#ffe7b8',
    bgRay: '#fffaf0',
    key: '#fff0d6',
    keyIntensity: 2.5,
    rim: '#ffe2c2',
    rimIntensity: 1.0,
    hemiSky: '#fff5e6',
    hemiGround: '#d9a877',
    hemiIntensity: 0.5,
    shadow: '#6b3a1c',
    shadowOpacity: 0.36,
    glow: '#ffc76a',
    exposure: 1.0,
  },
  dark: {
    bgTop: '#2a1a12',
    bgBottom: '#120c09',
    bgGlow: '#4a2a1e',
    bgRay: '#5a3d22',
    key: '#ffe2bf',
    keyIntensity: 2.2,
    rim: '#e4ede6',
    rimIntensity: 1.9,
    hemiSky: '#46302a',
    hemiGround: '#120b08',
    hemiIntensity: 0.35,
    shadow: '#000000',
    shadowOpacity: 0.6,
    glow: '#ffb660',
    exposure: 0.98,
  },
} as const;

interface Softbox {
  size: [number, number];
  pos: [number, number, number];
  color: string;
  intensity: number;
}

const SOFTBOXES: Record<SceneTheme, Softbox[]> = {
  light: [
    { size: [18, 10], pos: [0, 13, 7], color: '#fff2de', intensity: 4.2 },
    { size: [8, 12], pos: [-15, 4, 5], color: '#ffe0bd', intensity: 2.1 },
    { size: [7, 11], pos: [15, 5, -5], color: '#ffe4c8', intensity: 2.0 },
    { size: [12, 5], pos: [0, 6, -15], color: '#ffe6c4', intensity: 1.4 },
    { size: [12, 4], pos: [0, 1.5, 16], color: '#fff6ea', intensity: 1.3 },
    { size: [2, 14], pos: [-9, 6, 11], color: '#ffffff', intensity: 5.2 },
    { size: [2, 14], pos: [10, 6, 10], color: '#ffffff', intensity: 4.2 },
    { size: [14, 8], pos: [0, 12, -10], color: '#fff8ee', intensity: 3.4 },
  ],
  dark: [
    { size: [16, 9], pos: [0, 13, 7], color: '#ffe4c4', intensity: 2.2 },
    { size: [7, 11], pos: [-15, 4, 5], color: '#ffbf70', intensity: 1.2 },
    { size: [7, 12], pos: [15, 5, -5], color: '#e2ece4', intensity: 1.6 },
    { size: [12, 5], pos: [0, 6, -15], color: '#6e5a42', intensity: 0.8 },
    { size: [12, 4], pos: [0, 1.5, 16], color: '#ffe6cc', intensity: 0.5 },
    { size: [2, 14], pos: [-9, 6, 11], color: '#ffe9d2', intensity: 3.2 },
    { size: [14, 8], pos: [0, 12, -10], color: '#ffe8d2', intensity: 2.2 },
  ],
};

/** A little photo studio of emissive softboxes inside a warm gradient dome. */
export function createEnvironmentScene(theme: SceneTheme) {
  const scene = new THREE.Scene();
  const dome = new THREE.SphereGeometry(40, 32, 16);
  const pos = dome.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const sky = new THREE.Color(theme === 'light' ? '#fff0dc' : '#2a1a14');
  const ground = new THREE.Color(theme === 'light' ? '#c9935e' : '#0b0706');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.smoothstep(pos.getY(i) / 40, -0.4, 0.5);
    c.copy(ground).lerp(sky, t).multiplyScalar(theme === 'light' ? 0.72 : 0.45);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  dome.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false })));
  for (const b of SOFTBOXES[theme]) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(b.size[0], b.size[1]),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(b.color).multiplyScalar(b.intensity), side: THREE.DoubleSide, toneMapped: false }),
    );
    m.position.set(...b.pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  }
  return scene;
}

export function createEnvironmentMap(renderer: THREE.WebGLRenderer, theme: SceneTheme) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = createEnvironmentScene(theme);
  const target = pmrem.fromScene(envScene, 0.04);
  envScene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();
  return target;
}
