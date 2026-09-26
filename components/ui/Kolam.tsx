'use client';

import { motion } from 'framer-motion';
import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

function petalPath(cx: number, cy: number, angle: number, inner: number, outer: number, width: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const px = -s;
  const py = c;
  const x0 = cx + c * inner;
  const y0 = cy + s * inner;
  const x1 = cx + c * outer;
  const y1 = cy + s * outer;
  const mid = inner + (outer - inner) * 0.45;
  const mx = cx + c * mid;
  const my = cy + s * mid;
  const f = (n: number) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)} Q${f(mx + px * width)} ${f(my + py * width)} ${f(x1)} ${f(y1)} Q${f(mx - px * width)} ${f(my - py * width)} ${f(x0)} ${f(y0)} Z`;
}

/**
 * Lotus kolam: rangoli-style line art (petals, loops and dots) that draws
 * itself in when it scrolls into view. Colour comes from `currentColor`.
 */
export function Kolam({
  className,
  petals = 12,
  spin = false,
  draw = true,
  strokeWidth = 1.2,
}: {
  className?: string;
  petals?: number;
  spin?: boolean;
  draw?: boolean;
  strokeWidth?: number;
}) {
  const paths = useMemo(() => {
    const out: Array<{ d: string; delay: number }> = [];
    const step = (Math.PI * 2) / petals;
    for (let i = 0; i < petals; i++) {
      const a = i * step - Math.PI / 2;
      out.push({ d: petalPath(100, 100, a, 14, 58, 13), delay: 0 });
      out.push({ d: petalPath(100, 100, a + step / 2, 50, 86, 10), delay: 0.25 });
      out.push({ d: petalPath(100, 100, a, 62, 96, 5.5), delay: 0.45 });
    }
    return out;
  }, [petals]);
  const dots = useMemo(() => {
    // rounded so server and browser trigonometry print identical attributes
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const out: Array<[number, number, number]> = [];
    const step = (Math.PI * 2) / petals;
    for (let i = 0; i < petals; i++) {
      const a = i * step - Math.PI / 2 + step / 2;
      out.push([r2(100 + Math.cos(a) * 36), r2(100 + Math.sin(a) * 36), 1.8]);
      out.push([r2(100 + Math.cos(a - step / 2) * 76), r2(100 + Math.sin(a - step / 2) * 76), 1.5]);
      out.push([r2(100 + Math.cos(a) * 95), r2(100 + Math.sin(a) * 95), 1.3]);
    }
    return out;
  }, [petals]);
  // the same markup on server and client; the reduced-motion CSS stops the spin
  const animate = draw;
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('pointer-events-none', spin && 'animate-spin-slow', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <motion.circle
        cx="100"
        cy="100"
        r="8"
        initial={animate ? { pathLength: 0 } : false}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      {paths.map((p, i) => (
        <motion.path
          key={i}
          d={p.d}
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, delay: p.delay + (i % 3) * 0.02, ease: EASE }}
        />
      ))}
      <motion.circle
        cx="100"
        cy="100"
        r="99"
        strokeDasharray="1.5 5"
        initial={animate ? { pathLength: 0 } : false}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2.4, delay: 0.3, ease: EASE }}
      />
      <g fill="currentColor" stroke="none">
        {dots.map(([x, y, r], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            initial={animate ? { scale: 0, opacity: 0 } : false}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 + (i % petals) * 0.03, ease: EASE }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * A woven chain kolam border: two sine strands crossing between a row of dots,
 * which is how traditional kolam borders are drawn at a threshold.
 */
export function KolamBorder({ className, loops = 14, draw = true }: { className?: string; loops?: number; draw?: boolean }) {
  const s = 24;
  const a = 9;
  const w = loops * s;
  const strand = (sign: 1 | -1) => {
    let d = `M0 ${12}`;
    for (let k = 0; k < loops; k++) {
      const x0 = k * s;
      d += ` C${x0 + s * 0.36} ${12 + sign * a * 1.3} ${x0 + s * 0.64} ${12 + sign * a * 1.3} ${x0 + s} 12`;
    }
    return d;
  };
  const animate = draw;
  return (
    <svg viewBox={`-4 0 ${w + 8} 24`} preserveAspectRatio="none" className={cn('pointer-events-none', className)} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" aria-hidden="true">
      {[1, -1].map((sign) => (
        <motion.path
          key={sign}
          d={strand(sign as 1 | -1)}
          initial={animate ? { pathLength: 0 } : false}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: EASE, delay: sign === 1 ? 0 : 0.15 }}
        />
      ))}
      <g fill="currentColor" stroke="none">
        {Array.from({ length: loops }, (_, k) => (
          <circle key={k} cx={k * s + s / 2} cy={12} r={1.6} />
        ))}
      </g>
    </svg>
  );
}

/** A curled wood shaving: a ribbon wound into a loose spiral, honey on the outside, pale inside. */
export function WoodShaving({ className, variant = 0 }: { className?: string; variant?: 0 | 1 | 2 }) {
  const id = useId().replace(/:/g, '');
  const paths = [
    'M6 30 C 6 12, 30 4, 42 16 C 54 28, 40 46, 26 40 C 14 35, 18 20, 30 22 C 38 24, 36 34, 30 33',
    'M4 24 C 14 6, 44 6, 50 22 C 56 40, 30 50, 20 38 C 12 28, 26 16, 36 24 C 42 30, 34 38, 28 34',
    'M8 40 C 2 20, 24 2, 42 12 C 58 22, 46 46, 30 44 C 18 42, 18 26, 30 26',
  ];
  return (
    <svg viewBox="0 0 60 50" className={cn('pointer-events-none', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d3a2" />
          <stop offset="0.5" stopColor="#d9a060" />
          <stop offset="1" stopColor="#b06c34" />
        </linearGradient>
      </defs>
      <path d={paths[variant]} fill="none" stroke={`url(#${id}-s)`} strokeWidth="5.5" strokeLinecap="round" />
      <path d={paths[variant]} fill="none" stroke="#fff4dd" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Honey divider with a small lotus knot in the middle. */
export function HoneyDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)} aria-hidden="true">
      <span className="honey-line w-16 sm:w-24" />
      <svg viewBox="0 0 24 12" className="h-3 w-6 text-honey">
        <path d="M12 1 C 15 4, 15 8, 12 11 C 9 8, 9 4, 12 1 Z" fill="currentColor" />
        <path d="M11 9 C 7 9, 3 7, 1 5 C 5 4, 9 5, 11 9 Z M13 9 C 17 9, 21 7, 23 5 C 19 4, 15 5, 13 9 Z" fill="currentColor" opacity="0.6" />
      </svg>
      <span className="honey-line w-16 sm:w-24" />
    </div>
  );
}
