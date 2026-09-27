'use client';

import { MotionConfig, useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import { useEffect, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { setLenis } from '@/lib/scroll';
import { useThemeStore } from '@/store/theme';
import { useCartStore } from '@/store/cart';
import { useMinQty } from './AppData';

/** Keeps <html data-theme> in sync with the store and the OS preference. */
function ThemeSync() {
  const choice = useThemeStore((s) => s.choice);
  const resolved = useThemeStore((s) => s.resolved);
  const setResolved = useThemeStore((s) => s.setResolved);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.resolve(useThemeStore.persist.rehydrate()).then(() => {
      const dom = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      useThemeStore.setState({ resolved: useThemeStore.getState().choice ?? dom });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (choice) {
      setResolved(choice);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setResolved(mq.matches ? 'dark' : 'light');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [ready, choice, setResolved]);

  useEffect(() => {
    if (!ready) return;
    const el = document.documentElement;
    if (el.getAttribute('data-theme') === resolved) return;
    el.classList.add('theme-transition');
    el.setAttribute('data-theme', resolved);
    el.style.colorScheme = resolved;
    const t = window.setTimeout(() => el.classList.remove('theme-transition'), 520);
    return () => window.clearTimeout(t);
  }, [ready, resolved]);

  return null;
}

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger never drifts. */
function SmoothScroll() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      anchors: { offset: -72 },
      autoRaf: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) window.setTimeout(() => lenis.scrollTo(target as HTMLElement, { offset: -72, immediate: true }), 60);
    }

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, [reduce]);

  return null;
}

function StoreHydration() {
  const minQty = useMinQty();
  const [hydrated, setHydrated] = useState(false);
  // read the saved cart before anything writes to the store: persist saves on every set()
  useEffect(() => {
    Promise.resolve(useCartStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);
  useEffect(() => {
    if (hydrated) useCartStore.getState().setMinQty(minQty);
  }, [hydrated, minQty]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeSync />
      <StoreHydration />
      <SmoothScroll />
      {children}
    </MotionConfig>
  );
}
