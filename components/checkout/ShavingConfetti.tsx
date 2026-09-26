'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const RIBBONS = ['#e9b877', '#d9a060', '#c68642', '#f3d3a2', '#b06c34'];
const BITS = ['#3f7a5a', '#facc15', '#b9d3b1', '#fde68a'];
const CURLS = [
  'M6 30 C 6 12, 30 4, 42 16 C 54 28, 40 46, 26 40 C 14 35, 18 20, 30 22',
  'M4 24 C 14 6, 44 6, 50 22 C 56 40, 30 50, 20 38 C 12 28, 26 16, 36 24',
  'M8 40 C 2 20, 24 2, 42 12 C 58 22, 46 46, 30 44',
];

/** Curled wood shavings and a little green & marigold confetti drifting down, for celebrations. */
export function ShavingConfetti({ count = 46 }: { count?: number }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
          return x - Math.floor(x);
        };
        return {
          left: r(1) * 100,
          delay: r(2) * 2.4,
          duration: 4.5 + r(3) * 3.5,
          size: 16 + r(4) * 20,
          rotate: r(5) * 360,
          drift: (r(6) - 0.5) * 180,
          curl: r(8) > 0.35,
          variant: Math.floor(r(9) * CURLS.length),
          color: r(8) > 0.35 ? RIBBONS[Math.floor(r(7) * RIBBONS.length)] : BITS[Math.floor(r(7) * BITS.length)],
        };
      }),
    [count],
  );
  if (!mounted || reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute -top-12 block"
          style={{ left: `${p.left}%`, width: p.curl ? p.size : p.size * 0.4, height: p.curl ? p.size * 0.85 : p.size * 0.8 }}
          initial={{ y: -40, x: 0, rotate: p.rotate, opacity: 0 }}
          animate={{ y: '112vh', x: p.drift, rotate: p.rotate + 540, opacity: [0, 1, 1, 0.9] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: 1, repeatDelay: 0.6 }}
        >
          {p.curl ? (
            <svg viewBox="0 0 60 50" className="h-full w-full">
              <path d={CURLS[p.variant]} fill="none" stroke={p.color} strokeWidth="6" strokeLinecap="round" />
              <path d={CURLS[p.variant]} fill="none" stroke="#fff4dd" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : (
            <span className="block h-full w-full rounded-sm" style={{ background: p.color }} />
          )}
        </motion.span>
      ))}
    </div>
  );
}
