'use client';

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { testimonials } from '@/data/testimonials';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Kolam } from '@/components/ui/Kolam';
import { cn } from '@/lib/utils';

const AVATAR = ['#f9a8d4', '#facc15', '#e2a867', '#f472b6', '#fde68a', '#c68642'];

export function Testimonials() {
  const reduce = useReducedMotion();
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const n = testimonials.length;

  const go = useCallback((next: number, d: number) => setState([((next % n) + n) % n, d]), [n]);

  useEffect(() => {
    if (reduce || paused) return;
    const timer = window.setTimeout(() => go(index + 1, 1), 6500);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduce, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(index + 1, 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(index - 1, -1);
  };

  const item = testimonials[index];
  const peek = [testimonials[(index + n - 1) % n], testimonials[(index + 1) % n]];

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="relative scroll-mt-20 overflow-hidden bg-bg-2 py-24 sm:py-32">
      <div className="honey-line absolute inset-x-0 top-0" />
      <Kolam className="absolute -right-40 top-10 h-[30rem] w-[30rem] text-honey/15" spin />
      <Kolam className="absolute -left-48 bottom-0 h-[26rem] w-[26rem] text-pink-strong/[0.07]" petals={10} />
      <div className="container-page relative">
        <SectionHeading
          id="reviews-title"
          eyebrow="Kind words"
          title="Loved in kitchens"
          accent="across India"
          subtitle="From first rotis to wedding return gifts, here’s what families say about their Padmavathi pieces."
        />
        <div
          className="relative mx-auto mt-14 max-w-3xl"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="relative min-h-[24rem] sm:min-h-[19rem]" aria-live="polite">
            {/* the neighbours peek out behind, like cards in a stack */}
            <div className="pointer-events-none absolute inset-x-10 bottom-3 top-6 hidden sm:block" aria-hidden="true">
              {peek.map((p, i) => (
                <div
                  key={`${p.id}-${i}`}
                  className={cn('absolute inset-0 rounded-[2rem] border border-line bg-card/70 shadow-soft', i === 0 ? '-rotate-3 -translate-x-6' : 'rotate-3 translate-x-6')}
                />
              ))}
            </div>
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.figure
                key={index}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 90, rotate: d * 3, scale: 0.95 }),
                  center: { opacity: 1, x: 0, rotate: 0, scale: 1 },
                  exit: (d: number) => ({ opacity: 0, x: d * -90, rotate: d * -3, scale: 0.95 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                drag={reduce ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={onDragEnd}
                className="relative cursor-grab touch-pan-y rounded-[2rem] border border-line bg-card p-6 pt-10 shadow-lift active:cursor-grabbing sm:p-10 sm:pt-12"
              >
                <svg viewBox="0 0 64 48" className="absolute -top-6 left-8 h-12 w-16 drop-shadow" aria-hidden="true">
                  <path d="M4 44V26C4 12 12 4 26 2v8c-7 2-10 6-10 12h10v22H4Zm32 0V26c0-14 8-22 22-24v8c-7 2-10 6-10 12h10v22H36Z" fill="url(#q-wood)" />
                  <defs>
                    <linearGradient id="q-wood" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#e9b877" />
                      <stop offset="1" stopColor="#a0522d" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex gap-1" role="img" aria-label={`Rated ${item.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 500, damping: 15 }}>
                      <Star size={18} className={i < item.rating ? 'fill-[#facc15] text-[#e0a800]' : 'text-line-strong'} aria-hidden="true" />
                    </motion.span>
                  ))}
                </div>
                <blockquote className="mt-4 font-display text-lg leading-relaxed text-fg sm:text-[1.6rem] sm:leading-snug">“{item.quote}”</blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-full font-display text-lg font-semibold text-[#3a1f0c] shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AVATAR[index % AVATAR.length]}, #fff7e0)` }}
                  >
                    {item.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-semibold text-fg">{item.name}</span>
                    <span className="block text-sm text-muted">
                      {item.city} · {item.product}
                    </span>
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(index - 1, -1)}
              aria-label="Previous review"
              className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-fg transition-colors hover:border-honey"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex">
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => go(i, i > index ? 1 : -1)}
                  aria-label={`Show review ${i + 1} of ${n}`}
                  aria-current={i === index}
                  className="group grid h-10 place-items-center px-1"
                >
                  <span
                    className={cn(
                      'relative block h-2.5 overflow-hidden rounded-full transition-all duration-500',
                      i === index ? 'w-9 bg-line-strong' : 'w-2.5 bg-line-strong group-hover:bg-honey',
                    )}
                  >
                    {i === index && !reduce && (
                      <motion.span
                        key={`${index}-${paused}`}
                        className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#ec4899,#c68642)]"
                        initial={{ width: '0%' }}
                        animate={{ width: paused ? '0%' : '100%' }}
                        transition={{ duration: paused ? 0.2 : 6.5, ease: 'linear' }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(index + 1, 1)}
              aria-label="Next review"
              className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-fg transition-colors hover:border-honey"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          {/* TODO(shop owner): remove this line once the sample reviews in data/testimonials.ts are replaced with real ones */}
          <p className="mt-4 text-center text-xs text-muted/80">Sample reviews shown for layout. Replace with real customer reviews.</p>
        </div>
      </div>
    </section>
  );
}
