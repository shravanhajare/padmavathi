'use client';

import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerformanceMonitor } from '@react-three/drei';
import { Bloom, DepthOfField, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing';
import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import type { PerfTier } from '@/lib/device';
import { createEnvironmentMap, type SceneTheme } from '../models/environment';
import { computeLayout, FLOOR } from './choreography';
import { HeroWorld } from './world';

export interface HeroCanvasProps {
  progress: RefObject<number>;
  theme: SceneTheme;
  tier: PerfTier;
  /** Reduced motion: render a single still at `staticProgress`. */
  still?: boolean;
  staticProgress?: number;
  /** Pause rendering while the hero is off-screen. */
  active: boolean;
  onLoadProgress?: (value: number) => void;
  onReady?: () => void;
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const BG = { light: '#fff4e2', dark: '#15100c' } as const;

function Post({ world, tier }: { world: HeroWorld; tier: PerfTier }) {
  const dof = useRef<DepthOfFieldEffect>(null);
  useEffect(() => {
    if (dof.current) dof.current.target = world.focus;
  }, [world, tier]);
  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 2} enableNormalPass={false}>
      {tier === 'high' ? <DepthOfField ref={dof} target={world.focus} focusRange={6} bokehScale={2.4} resolutionScale={0.5} /> : <></>}
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.9} luminanceSmoothing={0.2} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}

function HeroScene({ progress, theme, tier, still, staticProgress = 1, onLoadProgress, onReady }: Omit<HeroCanvasProps, 'active'>) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const [world, setWorld] = useState<HeroWorld | null>(null);
  const envs = useRef<Partial<Record<SceneTheme, THREE.WebGLRenderTarget>>>({});
  const pointer = useRef({ x: 0, y: 0 });
  const smooth = useRef(still ? staticProgress : 0);
  const readyAt = useRef<number | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const buildTier = useRef(tier).current;

  // Build everything once, in small steps so the loader keeps animating.
  useEffect(() => {
    let cancelled = false;
    let built: HeroWorld | null = null;
    gl.localClippingEnabled = true; // the bark peels away at the tool front
    // clear render targets to transparent: the contact shadow map relies on it, and with
    // `alpha: false` three.js would otherwise clear them to opaque black (a grey floor)
    gl.setClearColor('#000000', 0);
    (async () => {
      onLoadProgress?.(0.3);
      await document.fonts.ready;
      await nextFrame();
      if (cancelled) return;
      built = new HeroWorld({ tier: buildTier });
      onLoadProgress?.(0.62);
      await nextFrame();
      if (cancelled) return;
      envs.current.light = createEnvironmentMap(gl, 'light');
      envs.current.dark = createEnvironmentMap(gl, 'dark');
      scene.environment = envs.current[themeRef.current]!.texture;
      scene.environmentIntensity = 0.6;
      scene.background = new THREE.Color(BG[themeRef.current]);
      built.setTheme(themeRef.current, true);
      scene.add(built.root);
      const layout = computeLayout(size.width / size.height);
      built.update(smooth.current, 2, 1 / 60, 1, layout, camera as THREE.PerspectiveCamera, pointer.current, gl.getPixelRatio());
      onLoadProgress?.(0.85);
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        /* compileAsync is an optimisation only */
      }
      if (cancelled) return;
      onLoadProgress?.(1);
      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __peHero?: unknown }).__peHero = { world: built, scene, gl, camera };
      }
      setWorld(built);
      invalidate();
    })();
    return () => {
      cancelled = true;
      if (built) scene.remove(built.root);
      Object.values(envs.current).forEach((t) => t?.dispose());
      envs.current = {};
      scene.environment = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!world) return;
    world.setTheme(theme, !!still);
    const env = envs.current[theme];
    if (env) scene.environment = env.texture;
    (scene.background as THREE.Color | null)?.set(BG[theme]);
    invalidate();
    if (!still) return;
    // the still frame renders on demand; give the contact shadows a few frames to settle their blur
    let n = 0;
    let raf = 0;
    const pump = () => {
      invalidate();
      if (++n < 12) raf = requestAnimationFrame(pump);
    };
    raf = requestAnimationFrame(pump);
    return () => cancelAnimationFrame(raf);
  }, [theme, world, scene, still, invalidate]);

  useEffect(() => {
    if (still) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [still]);

  // contact shadows only once things sit on a surface (the chakla lands at ~0.42)
  const shadowRef = useRef<THREE.Group>(null);
  const shadowOpacity = theme === 'dark' ? 0.62 : 0.42;

  const reportedReady = useRef(false);
  useFrame((state, delta) => {
    if (!world) return;
    const dt = Math.min(delta, 1 / 20);
    const target = still ? staticProgress : (progress.current ?? 0);
    smooth.current = still ? target : THREE.MathUtils.damp(smooth.current, target, 5.5, dt);
    if (readyAt.current === null) readyAt.current = state.clock.elapsedTime;
    const arrive = still ? 1 : Math.min(1, (state.clock.elapsedTime - readyAt.current) / 1.6);
    const t = still ? 2.2 : state.clock.elapsedTime;
    world.update(
      smooth.current,
      t,
      still ? 1 / 60 : dt,
      arrive,
      computeLayout(size.width / size.height),
      state.camera as THREE.PerspectiveCamera,
      pointer.current,
      state.viewport.dpr,
    );
    const shadow = shadowRef.current?.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | undefined;
    if (shadow) {
      // on for the chakla and the finale counter; off while the scraper (which brings its own blob) is centre stage
      const p = smooth.current;
      const k = THREE.MathUtils.smoothstep(p, 0.37, 0.43) * (1 - THREE.MathUtils.smoothstep(p, 0.62, 0.66) + THREE.MathUtils.smoothstep(p, 0.86, 0.9));
      shadow.material.opacity = shadowOpacity * k;
      shadow.visible = k > 0.001;
    }
    if (!reportedReady.current) {
      reportedReady.current = true;
      requestAnimationFrame(() => onReady?.());
    }
  });

  if (!world) return null;
  return (
    <>
      {tier !== 'low' &&
        createPortal(
          <ContactShadows
            ref={shadowRef}
            // write depth so depth of field sees the floor, not the far backdrop, and doesn't smear the shadows
            depthWrite
            // matches the finale counter's footprint, so nothing casts onto empty floor behind it
            position={[0.45, FLOOR + 0.005, 0]}
            scale={[9.2, 5]}
            far={4}
            blur={2.6}
            resolution={512}
            opacity={shadowOpacity}
            color={theme === 'dark' ? '#000000' : '#5c3a21'}
            frames={still ? 8 : Infinity}
          />,
          world.stage,
        )}
      {tier !== 'low' && !still && <Post world={world} tier={tier} />}
    </>
  );
}

export default function HeroCanvas(props: HeroCanvasProps) {
  const [tier, setTier] = useState<PerfTier>(props.tier);
  const dpr: [number, number] = tier === 'high' ? [1, 1.75] : tier === 'medium' ? [1, 1.5] : [1, 1.25];
  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: tier === 'low',
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
      }}
      camera={{ fov: 32, near: 0.1, far: 90, position: [0, 0.5, 12] }}
      frameloop={props.still ? 'demand' : props.active ? 'always' : 'never'}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
    >
      {!props.still && <PerformanceMonitor flipflops={3} onDecline={() => setTier((t) => (t === 'high' ? 'medium' : 'low'))} />}
      <HeroScene {...props} tier={tier} />
    </Canvas>
  );
}
