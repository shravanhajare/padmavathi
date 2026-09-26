'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { site } from '@/data/site';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Kolam, WoodShaving } from '@/components/ui/Kolam';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/** 1 · Choosing the wood: growth rings draw themselves on a log end. */
function RingsArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="oc-log" cx="0.45" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#f3d3a2" />
          <stop offset="1" stopColor="#c68642" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="148" rx="70" ry="7" fill="rgb(92 58 33 / 0.14)" />
      <rect x="40" y="30" width="120" height="112" rx="56" fill="#6b4528" />
      <circle cx="100" cy="86" r="56" fill="#5c3a21" />
      <circle cx="100" cy="86" r="50" fill="url(#oc-log)" />
      {[44, 37, 30, 23, 16, 9].map((r, i) => (
        <motion.circle
          key={r}
          cx={97 + i * 0.6}
          cy={88 - i * 0.4}
          r={r}
          fill="none"
          stroke="#a0522d"
          strokeOpacity={0.55}
          strokeWidth={1.6}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 1.4, delay: i * 0.15, ease: EASE }}
        />
      ))}
      <motion.path d="M100 86 L 138 56" stroke="#5c3a21" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ delay: 1.2, duration: 0.6 }} />
    </svg>
  );
}

/** 2 · Turning: the belan spins (moving highlights) while shavings curl off. */
function LatheArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="oc-belan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0c890" />
          <stop offset="0.5" stopColor="#c68642" />
          <stop offset="1" stopColor="#7a4424" />
        </linearGradient>
        <clipPath id="oc-clip">
          <rect x="44" y="62" width="112" height="30" rx="15" />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="148" rx="80" ry="7" fill="rgb(92 58 33 / 0.14)" />
      <rect x="14" y="70" width="18" height="14" rx="3" fill="#2a211b" />
      <rect x="168" y="70" width="18" height="14" rx="3" fill="#2a211b" />
      <rect x="28" y="71" width="18" height="12" rx="6" fill="#a0522d" />
      <rect x="154" y="71" width="18" height="12" rx="6" fill="#a0522d" />
      <rect x="44" y="62" width="112" height="30" rx="15" fill="url(#oc-belan)" />
      <g clipPath="url(#oc-clip)">
        {[0, 1, 2, 3].map((i) => (
          <motion.rect
            key={i}
            x={40 + i * 32}
            y={62}
            width="6"
            height="30"
            fill="#fff3dc"
            opacity="0.35"
            animate={{ y: [56, 98] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
          />
        ))}
      </g>
      {/* gouge */}
      <path d="M92 94 L 118 140" stroke="#9aa0a6" strokeWidth="4" strokeLinecap="round" />
      <path d="M113 131 L 128 158" stroke="#7a3f22" strokeWidth="9" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.path
          key={i}
          d="M0 0 C 0 -8, 10 -10, 12 -3 C 14 4, 4 7, 3 2"
          fill="none"
          stroke="#d9a060"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ x: 92, y: 92, opacity: 0, rotate: 0 }}
          animate={{ x: [92, 60 + i * 14], y: [92, 20 + (i % 3) * 14, 150], opacity: [0, 1, 0], rotate: [0, 200 + i * 40] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.32, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}

/** 3 · Sanding: a sanding block glides over a spatula, raising a little dust. */
function SandArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <ellipse cx="100" cy="148" rx="80" ry="7" fill="rgb(92 58 33 / 0.14)" />
      <path d="M22 110 C 40 96, 70 92, 104 94 L 150 96 C 170 96, 182 104, 182 112 C 182 120, 170 126, 150 126 L 104 126 C 70 128, 40 124, 22 110 Z" fill="#e2c291" />
      <path d="M40 106 C 70 102, 120 104, 170 108" fill="none" stroke="#b48d5f" strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M40 116 C 80 114, 130 116, 172 116" fill="none" stroke="#b48d5f" strokeOpacity="0.4" strokeWidth="1.5" />
      <motion.g animate={{ x: [-30, 30, -30] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
        <rect x="76" y="60" width="52" height="30" rx="7" fill="#5c3a21" />
        <rect x="74" y="84" width="56" height="10" rx="3" fill="#c9a66b" />
        <rect x="84" y="64" width="36" height="6" rx="3" fill="#7a4f2e" />
      </motion.g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.circle
          key={i}
          r={1.6 + (i % 3) * 0.6}
          fill="#e9c38f"
          initial={{ cx: 100, cy: 96, opacity: 0 }}
          animate={{ cx: [100, 70 + i * 12], cy: [96, 70 - (i % 3) * 12], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22 }}
        />
      ))}
    </svg>
  );
}

/** 4 · Oiling: a drop of coconut oil falls and spreads a glow across the grain. */
function OilArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="oc-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c68642" />
          <stop offset="1" stopColor="#8f4a24" />
        </linearGradient>
        <radialGradient id="oc-sheen" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3dc" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff3dc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="148" rx="80" ry="7" fill="rgb(92 58 33 / 0.14)" />
      <rect x="24" y="104" width="152" height="34" rx="8" fill="url(#oc-board)" />
      <path d="M30 116 C 70 110, 120 124, 170 114" fill="none" stroke="#5c3a21" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M30 128 C 80 122, 130 132, 170 126" fill="none" stroke="#5c3a21" strokeOpacity="0.35" strokeWidth="1.5" />
      {/* bottle */}
      <path d="M86 14 h28 v8 c 8 4 12 10 12 18 v 22 a 6 6 0 0 1 -6 6 h -40 a 6 6 0 0 1 -6 -6 v -22 c 0 -8 4 -14 12 -18 z" fill="#fef3c7" stroke="#e9c38f" strokeWidth="2" />
      <rect x="80" y="36" width="40" height="18" rx="3" fill="#facc15" opacity="0.7" />
      <motion.path
        d="M100 70 C 104 78, 106 82, 100 88 C 94 82, 96 78, 100 70 Z"
        fill="#facc15"
        animate={{ y: [0, 26, 26], opacity: [1, 1, 0], scale: [1, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.45, 0.6] }}
      />
      <motion.ellipse
        cx="100"
        cy="112"
        rx="60"
        ry="8"
        fill="url(#oc-sheen)"
        animate={{ opacity: [0, 0, 1, 0], scaleX: [0.2, 0.2, 1, 1.2] }}
        transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.45, 0.7, 1] }}
        style={{ originX: '100px', originY: '112px' }}
      />
    </svg>
  );
}

/** 5 · Packing: the crate lid closes over the wood wool and the stamp appears. */
function CrateArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <ellipse cx="100" cy="150" rx="80" ry="7" fill="rgb(92 58 33 / 0.14)" />
      <rect x="36" y="78" width="128" height="30" rx="3" fill="#e3c08c" />
      <rect x="36" y="112" width="128" height="30" rx="3" fill="#d9b27c" />
      <rect x="36" y="76" width="10" height="68" fill="#c9a06a" />
      <rect x="154" y="76" width="10" height="68" fill="#c9a06a" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${48 + i * 16} 80 c 6 -10 14 -6 10 2`} fill="none" stroke="#d4ab72" strokeWidth="2" />
      ))}
      <motion.g
        style={{ originX: '36px', originY: '76px' }}
        animate={{ rotate: [-70, 0, 0, -70] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.35, 0.8, 1], ease: 'easeInOut' }}
      >
        <rect x="32" y="66" width="136" height="12" rx="3" fill="#e9c996" />
      </motion.g>
      <g transform="translate(100 126)">
        <ellipse rx="22" ry="11" fill="none" stroke="#5c3a21" strokeWidth="1.6" opacity="0.8" />
        <image href="/icon.svg" x="-9" y="-9" width="18" height="18" opacity="0.85" />
      </g>
    </svg>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Choosing the wood',
    body: 'We pick air-seasoned teak, sheesham, neem and acacia with straight, tight grain, and reject anything with cracks, knots in the wrong place or too much moisture.',
    chip: 'Seasoned, never green',
    Art: RingsArt,
  },
  {
    n: '02',
    title: 'Turning on the lathe',
    body: 'The billet spins on the lathe while the turner shapes it with a gouge, pass after pass, feeling the profile by hand. No two belans come off quite the same.',
    chip: 'Shaped by hand and eye',
    Art: LatheArt,
  },
  {
    n: '03',
    title: 'Carving & sanding',
    body: 'Spatulas, spoons and churner heads are carved, then everything is sanded through the grits until the surface is smooth enough that dough and food slide off.',
    chip: 'Sanded to 400 grit',
    Art: SandArt,
  },
  {
    n: '04',
    title: 'The oil finish',
    body: 'We rub in food-grade, cold-pressed coconut oil (and beeswax for boards and boxes) and let it soak in. No lacquer, no varnish, nothing synthetic.',
    chip: 'Coconut oil & beeswax',
    Art: OilArt,
  },
  {
    n: '05',
    title: 'Packed with care',
    body: 'Every order is checked, wrapped in paper and bedded in wood wool. Gift sets travel in our branded crate, ready to hand over.',
    chip: 'Ships across India',
    Art: CrateArt,
  },
];

function StepCard({ step, className }: { step: (typeof STEPS)[number]; className?: string }) {
  const { Art } = step;
  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-[2rem] border border-line bg-card p-6 shadow-soft sm:p-8', className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-6 font-display text-[8rem] font-bold leading-none text-transparent [-webkit-text-stroke:1.2px_var(--border-strong)]"
      >
        {step.n}
      </span>
      <div className="relative h-44 rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_40%,#fff6e2,#f6dcc0)] p-3 dark:bg-[radial-gradient(circle_at_50%_40%,#3a2618,#1f140d)]">
        <Art />
      </div>
      <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-wood">Step {step.n}</p>
      <h3 className="mt-1.5 text-2xl font-semibold text-fg sm:text-[1.75rem]">{step.title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{step.body}</p>
      <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface-2/80 px-3 py-1 text-xs font-semibold text-fg">
        <span className="h-1.5 w-1.5 rounded-full bg-pink-strong" aria-hidden="true" />
        {step.chip}
      </span>
    </article>
  );
}

export function OurCraft() {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const belanRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const track = trackRef.current;
        const pin = pinRef.current;
        if (!track || !pin) return;
        const distance = () => track.scrollWidth - window.innerWidth;
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        tl.to(track, { x: () => -distance() }, 0);
        tl.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1 }, 0);
        tl.fromTo(belanRef.current, { left: '0%', rotate: 0 }, { left: '100%', rotate: 1080 }, 0);
        // cards lean in as they arrive
        track.querySelectorAll<HTMLElement>('[data-step]').forEach((card) => {
          gsap.fromTo(
            card,
            { rotateY: -18, opacity: 0.35, scale: 0.92 },
            {
              rotateY: 0,
              opacity: 1,
              scale: 1,
              ease: 'power2.out',
              scrollTrigger: { trigger: card, containerAnimation: tl, start: 'left 95%', end: 'left 45%', scrub: true },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: pinRef },
  );

  return (
    <section id="craft" aria-labelledby="craft-title" className="relative scroll-mt-20">
      <div className="relative overflow-hidden pb-10 pt-24 sm:pt-32">
        <Kolam className="absolute -left-40 top-10 h-[30rem] w-[30rem] text-honey/15" spin />
        <div className="container-page relative grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <SectionHeading
            id="craft-title"
            align="left"
            eyebrow="Our craft"
            title="From a log to"
            accent="your kitchen"
            subtitle="Padmavathi Enterprises is a small workshop of wood turners and carvers. We make the tools Indian kitchens have always relied on, the belan, the chakla, the mathani, the thuruvani, the way they have always been made: by hand, from solid wood, finished with oil."
          />
          <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {site.stats.map((s, i) => (
              <motion.li
                key={s.label}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
                className="flex items-center gap-5 rounded-[1.5rem] border border-line bg-card px-6 py-5 shadow-soft"
              >
                <span className="font-display text-4xl font-semibold text-gradient-wood italic">{s.value}</span>
                <span className="text-sm leading-snug text-muted">{s.label}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* the making process: a pinned horizontal timeline on desktop, a vertical stack elsewhere */}
      <div ref={pinRef} className="relative overflow-hidden lg:h-[100svh]">
        <div className="container-page relative hidden pt-24 lg:block">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-wood">The making, step by step</p>
            <p className="text-xs text-muted">Keep scrolling →</p>
          </div>
          <div className="relative mt-4 h-8">
            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-line" />
            <div ref={barRef} className="absolute inset-x-0 top-1/2 h-[3px] origin-left -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#ec4899,#c68642,#facc15)]" />
            <div ref={belanRef} className="absolute top-1/2 -ml-8 -translate-y-1/2" aria-hidden="true">
              <svg viewBox="0 0 64 16" className="h-4 w-16">
                <rect x="10" y="2" width="44" height="12" rx="6" fill="#c68642" />
                <rect x="0" y="5" width="12" height="6" rx="3" fill="#a0522d" />
                <rect x="52" y="5" width="12" height="6" rx="3" fill="#a0522d" />
              </svg>
            </div>
          </div>
        </div>
        <div
          ref={trackRef}
          className="container-page flex flex-col gap-6 pb-16 pt-8 [perspective:1400px] lg:w-max lg:max-w-none lg:flex-row lg:gap-8 lg:pl-[max(2rem,calc((100vw-1280px)/2+2rem))] lg:pr-[20vw] lg:pt-10"
        >
          {STEPS.map((s) => (
            <div key={s.n} data-step className="lg:w-[26rem] lg:shrink-0">
              <StepCard step={s} className="h-full" />
            </div>
          ))}
          <div data-step className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-line-strong p-10 text-center lg:w-[22rem] lg:shrink-0">
            <WoodShaving className="h-16 w-20 animate-sway" />
            <p className="font-display text-2xl font-semibold text-fg">…and then it’s yours.</p>
            <p className="text-sm text-muted">Cared for with a little oil, a wooden tool outlives every non-stick pan in the kitchen.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
