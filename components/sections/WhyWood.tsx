'use client';

import { motion, type Variants } from 'framer-motion';
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { SplitReveal } from '@/components/ui/SectionHeading';
import { KolamBorder } from '@/components/ui/Kolam';

const EASE = [0.16, 1, 0.3, 1] as const;
const draw: Variants = { rest: { pathLength: 0.001, opacity: 0.4 }, show: { pathLength: 1, opacity: 1, transition: { duration: 1.2, ease: EASE } } };

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  chemical: (
    <Icon>
      <motion.path variants={draw} d="M18 6h12M20 6v12L10 38a4 4 0 0 0 3.6 6h20.8a4 4 0 0 0 3.6-6L28 18V6" />
      <motion.path variants={draw} d="M14 30h20" />
      <motion.path variants={{ rest: { pathLength: 0 }, show: { pathLength: 1, transition: { delay: 0.6, duration: 0.5 } } }} d="M6 6 L42 42" stroke="#ec4899" strokeWidth="3" />
    </Icon>
  ),
  food: (
    <Icon>
      <motion.path variants={draw} d="M6 26h36a18 14 0 0 1-36 0Z" />
      <motion.path variants={draw} d="M30 6c4 0 6 3 6 6s-3 5-5 5l-9 9" />
      <motion.path variants={{ rest: { pathLength: 0 }, show: { pathLength: 1, transition: { delay: 0.7, duration: 0.4 } } }} d="M17 33l4 4 8-9" stroke="#facc15" strokeWidth="3" />
    </Icon>
  ),
  durable: (
    <Icon>
      <motion.path variants={draw} d="M24 42s14-7 14-18V10L24 5 10 10v14c0 11 14 18 14 18Z" />
      <motion.circle variants={draw} cx="24" cy="22" r="7" />
      <motion.circle variants={draw} cx="24" cy="22" r="3" />
    </Icon>
  ),
  eco: (
    <Icon>
      <motion.path variants={draw} d="M8 42h32" />
      <motion.path variants={{ rest: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 0.8, ease: EASE } } }} d="M24 42V20" />
      <motion.path
        variants={{ rest: { scale: 0, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { delay: 0.6, type: 'spring', stiffness: 260, damping: 12 } } }}
        style={{ originX: '24px', originY: '24px' }}
        d="M24 26c0-8 6-13 14-13 0 8-6 13-14 13Z"
        fill="currentColor"
        fillOpacity={0.2}
      />
      <motion.path
        variants={{ rest: { scale: 0, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { delay: 0.8, type: 'spring', stiffness: 260, damping: 12 } } }}
        style={{ originX: '24px', originY: '30px' }}
        d="M24 30c0-7-5-11-12-11 0 7 5 11 12 11Z"
        fill="currentColor"
        fillOpacity={0.2}
      />
    </Icon>
  ),
  gentle: (
    <Icon>
      <motion.path variants={draw} d="M4 28h26a12 10 0 0 1-26 0Z" />
      <motion.path variants={draw} d="M30 30h14" />
      <motion.path variants={draw} d="M20 22 34 6" />
      <motion.path
        variants={{ rest: { scale: 0, rotate: -45 }, show: { scale: [0, 1.3, 1], rotate: 0, transition: { delay: 0.9, duration: 0.6 } } }}
        style={{ originX: '10px', originY: '12px' }}
        d="M10 6v12M4 12h12"
        stroke="#facc15"
      />
    </Icon>
  ),
  tradition: (
    <Icon>
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <motion.path
          key={a}
          variants={{ rest: { pathLength: 0 }, show: { pathLength: 1, transition: { delay: i * 0.1, duration: 0.7 } } }}
          d="M24 24c-3-5-3-11 0-16 3 5 3 11 0 16Z"
          transform={`rotate(${a} 24 24)`}
        />
      ))}
      <motion.circle variants={draw} cx="24" cy="24" r="3" fill="currentColor" />
    </Icon>
  ),
};

const REASONS = [
  { id: 'chemical', title: 'Chemical-free', body: 'No lacquer, varnish or synthetic polish. Just wood and food-grade coconut oil, so nothing leaches into hot food.' },
  { id: 'food', title: 'Naturally food safe', body: 'Wood doesn’t react with tamarind, lemon or salt, and neem is naturally antibacterial. Perfect for pickles and tadka.' },
  { id: 'durable', title: 'Built for decades', body: 'Dense, seasoned hardwood turned from a single piece. With a little oil now and then, it outlives the kitchen it moves into.' },
  { id: 'eco', title: 'Kind to the planet', body: 'Plastic-free, biodegradable and made from responsibly sourced timber, with offcuts turned into spoons and shavings into compost.' },
  { id: 'gentle', title: 'Gentle on cookware', body: 'Wooden spatulas and ladles never scratch non-stick, cast iron or kadai surfaces, and stay cool in your hand.' },
  { id: 'tradition', title: 'Tradition in every piece', body: 'The same shapes your grandmother trusted, the belan, the mathani, the thuruvani, made the way they always have been.' },
];

export function WhyWood() {
  const ref = useRef<HTMLElement>(null);
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <section
      ref={ref}
      id="why-wood"
      aria-labelledby="why-title"
      onPointerMove={onMove}
      className="relative scroll-mt-20 overflow-hidden bg-[#2b1c12] py-24 text-[#fbefe1] [--mx:50%] [--my:30%] sm:py-32 dark:bg-[#1a120c]"
    >
      <div className="wood-grain absolute inset-0 opacity-20 [background-size:900px_300px]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_circle_at_var(--mx)_var(--my),rgb(233_184_119/0.18),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-0 h-3 bg-[linear-gradient(180deg,#c68642,#8f4a24)]" aria-hidden="true" />
      <div className="container-page relative">
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#f1c48d]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#f9a8d4]" aria-hidden="true" /> Why wood
          </motion.span>
          <h2 id="why-title" className="max-w-3xl text-[2.25rem] font-semibold leading-[1.06] sm:text-5xl lg:text-[3.5rem]">
            <SplitReveal text="Better for your food," /> <SplitReveal text="your pans and the planet" delay={0.2} wordClassName="italic text-[#f1c48d] pr-1" />
          </h2>
          <KolamBorder className="h-4 w-56 text-[#e2a867]/70" loops={10} />
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r, i) => (
            <motion.li
              key={r.id}
              initial="rest"
              whileInView="show"
              whileHover="show"
              viewport={{ once: true, margin: '-80px' }}
              className="group relative"
            >
              <motion.div
                variants={{
                  rest: { opacity: 0, y: 40, rotateX: 18 },
                  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, delay: (i % 3) * 0.1, ease: EASE } },
                }}
                style={{ transformPerspective: 900 }}
                className="relative h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition-[border-color,background-color,transform] duration-500 hover:-translate-y-1.5 hover:border-[#e2a867]/50 hover:bg-white/[0.07]"
              >
                <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgb(236_72_153/0.25),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgb(233_184_119/0.25),rgb(198_134_66/0.08))] text-[#f1c48d] ring-1 ring-[#e2a867]/30">
                  {ICONS[r.id]}
                </span>
                <h3 className="mt-6 text-2xl font-semibold text-[#fbefe1]">{r.title}</h3>
                <p className="mt-2.5 leading-relaxed text-[#e3cbb3]">{r.body}</p>
              </motion.div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
