'use client';

import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * An endless ribbon of words that speeds up with scroll velocity and turns
 * around when you scroll back up. Two copies of the content make the loop seamless.
 */
export function Marquee({
  items,
  className,
  speed = 40,
  reverse = false,
}: {
  items: string[];
  className?: string;
  speed?: number;
  reverse?: boolean;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-4, 0, 4], { clamp: false });
  const dir = useRef(reverse ? -1 : 1);
  const trackRef = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    if (reduce || !trackRef.current) return;
    const b = boost.get();
    if (b < -0.05) dir.current = reverse ? 1 : -1;
    else if (b > 0.05) dir.current = reverse ? -1 : 1;
    const w = trackRef.current.scrollWidth / 2;
    let next = x.get() - dir.current * (speed * (1 + Math.abs(b))) * (delta / 1000);
    if (next <= -w) next += w;
    if (next > 0) next -= w;
    x.set(next);
  });

  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={`${it}-${i}`} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-display text-2xl font-semibold italic sm:text-3xl">{it}</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-honey" aria-hidden="true">
            <path d="M12 2 C 15 7, 15 10, 12 14 C 9 10, 9 7, 12 2 Z" fill="currentColor" />
            <path d="M11 13 C 6 14, 3 12, 1 9 C 6 8, 9 9, 11 13 Z M13 13 C 18 14, 21 12, 23 9 C 18 8, 15 9, 13 13 Z" fill="currentColor" opacity="0.6" />
          </svg>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden="true">
      <motion.div ref={trackRef} className="flex w-max" style={{ x }}>
        {row}
        {row}
      </motion.div>
    </div>
  );
}
