'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { HoneyDivider } from './Kolam';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Words rise out of a mask one after another, like type being set. */
export function SplitReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.06,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  // MotionConfig reducedMotion="user" snaps these transforms for people who ask for less motion.
  // The in-view check lives on the unclipped wrapper: each word starts pushed fully inside its
  // overflow mask, so observing the word itself never fires for short words like "to".
  const words = text.split(' ');
  return (
    <motion.span className={className} initial="hidden" whileInView="shown" viewport={{ once: true, margin: '-60px' }}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className={cn('inline-block', wordClassName)}
            variants={{ hidden: { y: '105%', rotate: 4 }, shown: { y: '0%', rotate: 0 } }}
            transition={{ duration: 0.9, delay: delay + i * stagger, ease: EASE }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </motion.span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
  align = 'center',
  id,
  className,
}: {
  eyebrow: string;
  title: string;
  /** Rendered after the title in the gradient italic. */
  accent?: string;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
  id?: string;
  className?: string;
}) {
  const center = align === 'center';
  const titleWords = title.split(' ').length;
  return (
    <div className={cn('flex flex-col gap-4', center ? 'items-center text-center' : 'items-start text-left', className)}>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: EASE }}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-wood backdrop-blur"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden="true" />
        {eyebrow}
      </motion.span>
      <h2 id={id} className="max-w-3xl text-[2.25rem] font-semibold leading-[1.06] text-fg sm:text-5xl lg:text-[3.5rem]">
        <SplitReveal text={title} />
        {accent && (
          <>
            {' '}
            <SplitReveal text={accent} delay={titleWords * 0.06} wordClassName="text-gradient-wood italic pr-1" />
          </>
        )}
      </h2>
      {center && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0.3 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
        >
          <HoneyDivider />
        </motion.div>
      )}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
