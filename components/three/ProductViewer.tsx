'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PresentationControls, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { ModelSpec } from '@/data/types';
import { createProductComposition } from './models/composition';
import { createPiece, fitToReference, glbUrlFor } from './models/registry';
import { createEnvironmentMap, SCENE_PALETTE, type SceneTheme } from './models/environment';

/** Radius of the sphere every piece is scaled to. */
const FIT_R = 1.6;

/**
 * Scales a composition so its bounding sphere has radius FIT_R and rests it on
 * y = 0. A sphere, not a box, so a long ladle still fits at every angle of the
 * turntable. Pure: it wraps a freshly built object, so StrictMode's
 * double-invoked memos never fight over the same parent.
 */
function fit(object: THREE.Object3D) {
  const group = new THREE.Group();
  group.add(object);
  const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  object.scale.setScalar(FIT_R / sphere.radius);
  const b2 = new THREE.Box3().setFromObject(object);
  const c = b2.getCenter(new THREE.Vector3());
  object.position.set(-c.x, -b2.min.y, -c.z);
  return { group, centerY: (b2.max.y - b2.min.y) / 2 };
}

const VIEW_DIR = new THREE.Vector3(0, 2.5, 7.6).normalize();

/** Pulls the camera back just far enough for the fitted sphere to fill the canvas, whatever its aspect. */
function useFrameSphere(centerY: number) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  useLayoutEffect(() => {
    const aspect = width / Math.max(height, 1);
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const dist = (FIT_R / Math.sin(Math.min(vHalf, hHalf))) * 1.06;
    // in a tall pane, spend the spare height lowering the piece towards the counter
    const spare = Math.max(0, dist * Math.tan(vHalf) - FIT_R * 1.1);
    const target = new THREE.Vector3(0, centerY + spare * 0.55, 0);
    camera.position.copy(target).addScaledVector(VIEW_DIR, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, width, height, centerY]);
}

function ProceduralModel({ spec }: { spec: ModelSpec }) {
  const fitted = useMemo(() => fit(createProductComposition(spec, 'high')), [spec]);
  useFrameSphere(fitted.centerY);
  return <primitive object={fitted.group} />;
}

/** When a GLB is mapped for this product, load it with drei's useGLTF and stage it like the procedural one. */
function GLBModel({ spec, url }: { spec: ModelSpec; url: string }) {
  const gltf = useGLTF(url);
  const fitted = useMemo(
    () => fit(createProductComposition(spec, 'high', fitToReference(gltf.scene, createPiece(spec, 'low')))),
    [spec, gltf],
  );
  useFrameSphere(fitted.centerY);
  return <primitive object={fitted.group} />;
}

/** A slow turntable under the piece; PresentationControls adds the user's drag on top. */
function Turntable({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.05) * 0.35;
  });
  return <group ref={ref}>{children}</group>;
}

function Environment({ theme }: { theme: SceneTheme }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const target = createEnvironmentMap(gl, theme);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.62;
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene, theme]);
  return null;
}

/**
 * Live 3D quick view: drag to turn the piece (PresentationControls springs it
 * back when released). On touch screens a vertical swipe still scrolls the sheet.
 */
export default function ProductViewer({ spec, theme, label }: { spec: ModelSpec; theme: SceneTheme; label?: string }) {
  const pal = SCENE_PALETTE[theme];
  const url = glbUrlFor(spec);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 30, position: [0, 3.2, 7.6], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor('#000000', 0);
        camera.lookAt(0, 0.7, 0); // until the model mounts and frames itself
      }}
      aria-label={label ?? 'Interactive 3D view. Drag to rotate.'}
      role="img"
      style={{ touchAction: 'pan-y' }}
    >
      <Environment theme={theme} />
      <directionalLight position={[3, 6, 4]} intensity={pal.keyIntensity * 0.62} color={pal.key} />
      <directionalLight position={[-5, 3, -4]} intensity={pal.rimIntensity * 0.6} color={pal.rim} />
      <hemisphereLight args={[pal.hemiSky, pal.hemiGround, 0.35]} />
      <PresentationControls
        global={false}
        cursor
        snap
        speed={1.4}
        zoom={1}
        rotation={[0.08, -0.35, 0]}
        polar={[-0.35, 0.45]}
        azimuth={[-Math.PI, Math.PI]}
        damping={0.25}
      >
        <Turntable>
          <Suspense fallback={null}>{url ? <GLBModel spec={spec} url={url} /> : <ProceduralModel spec={spec} />}</Suspense>
        </Turntable>
      </PresentationControls>
      <ContactShadows position={[0, 0.001, 0]} scale={9} blur={2.4} far={3} opacity={theme === 'dark' ? 0.6 : 0.36} color={theme === 'dark' ? '#000' : '#5c3a21'} />
    </Canvas>
  );
}
