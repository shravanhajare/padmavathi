'use client';

import type Lenis from 'lenis';

/**
 * Tiny global handle to the Lenis instance so any component can scroll or
 * lock scrolling without prop drilling. Falls back to native scrolling when
 * Lenis is disabled (reduced motion).
 */
let lenis: Lenis | null = null;
let locks = 0;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

const NAV_OFFSET = -72;

export function scrollToTarget(
  target: string | number | HTMLElement,
  opts: { offset?: number; immediate?: boolean; duration?: number } = {},
) {
  const offset = opts.offset ?? (typeof target === 'number' ? 0 : NAV_OFFSET);
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate: opts.immediate, duration: opts.duration ?? 1.4, force: true });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let top: number | null = null;
  if (typeof target === 'number') top = target;
  else {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (el) top = el.getBoundingClientRect().top + window.scrollY + offset;
  }
  if (top !== null) window.scrollTo({ top, behavior: opts.immediate || reduce ? 'auto' : 'smooth' });
}

export function lockScroll() {
  locks += 1;
  if (locks === 1) {
    lenis?.stop();
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (scrollbar > 0) document.documentElement.style.paddingRight = `${scrollbar}px`;
  }
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.documentElement.style.overflow = '';
    document.documentElement.style.paddingRight = '';
    lenis?.start();
  }
}
