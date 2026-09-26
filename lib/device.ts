'use client';

export type PerfTier = 'high' | 'medium' | 'low';

interface NavigatorExtras {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/**
 * Coarse device classification used to scale the 3D scene: particle counts,
 * post-processing and pixel ratio.
 */
export function detectPerfTier(): PerfTier {
  if (typeof window === 'undefined') return 'medium';
  const nav = navigator as Navigator & NavigatorExtras;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const saveData = nav.connection?.saveData === true || /2g/.test(nav.connection?.effectiveType ?? '');

  if (saveData || cores <= 2 || memory <= 2) return 'low';
  if (coarse || small) return cores >= 8 && memory >= 6 ? 'medium' : 'low';
  if (cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}

export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
