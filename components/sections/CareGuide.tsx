'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Check, Citrus, Droplets, Sparkles, Sun, X } from 'lucide-react';
import { useRef } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { WoodShaving } from '@/components/ui/Kolam';
import { useT } from '@/i18n/client';

const EASE = [0.16, 1, 0.3, 1] as const;

const STEP_STYLE = [
  { Icon: Droplets, tint: 'from-[#eaf3e4] to-[#cfe3c7] dark:from-[#1f3326] dark:to-[#15221a]' },
  { Icon: Sun, tint: 'from-[#fff4d6] to-[#fde68a] dark:from-[#3f2c16] dark:to-[#2a1d0e]' },
  { Icon: Sparkles, tint: 'from-[#fbe7cf] to-[#e9c38f] dark:from-[#3d2818] dark:to-[#271a10]' },
  { Icon: Citrus, tint: 'from-[#eef7e4] to-[#cfe7c1] dark:from-[#223027] dark:to-[#161f19]' },
];

export function CareGuide() {
  const t = useT();
  const c = t.sections.care;
  const steps = c.steps.map((st, i) => ({ ...st, ...STEP_STYLE[i] }));
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const line = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), { stiffness: 80, damping: 20 });

  return (
    <section id="care" aria-labelledby="care-title" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <WoodShaving className="absolute left-[6%] top-32 h-12 w-14 animate-sway opacity-70" variant={2} />
      <div className="container-page relative">
        <SectionHeading
          id="care-title"
          eyebrow={c.eyebrow}
          title={c.title}
          accent={c.accent}
          subtitle={c.subtitle}
        />

        <div ref={ref} className="relative mt-16">
          {/* a woven kolam line that draws itself behind the steps as you scroll */}
          <svg viewBox="0 0 1000 60" preserveAspectRatio="none" className="absolute inset-x-[6%] top-12 hidden h-14 w-[88%] text-honey lg:block" aria-hidden="true">
            <motion.path
              d="M0 30 C 60 0, 100 0, 125 30 S 190 60, 250 30 S 315 0, 375 30 S 440 60, 500 30 S 565 0, 625 30 S 690 60, 750 30 S 815 0, 875 30 S 940 60, 1000 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ pathLength: line }}
            />
            <motion.path
              d="M0 30 C 60 60, 100 60, 125 30 S 190 0, 250 30 S 315 60, 375 30 S 440 0, 500 30 S 565 60, 625 30 S 690 0, 750 30 S 815 60, 875 30 S 940 0, 1000 30"
              fill="none"
              stroke="#3f7a5a"
              strokeOpacity="0.5"
              strokeWidth="1.6"
              style={{ pathLength: line }}
            />
          </svg>
          {/* phones: the steps become a timeline whose thread draws itself as you scroll */}
          <span className="absolute bottom-10 left-8 top-10 w-0.5 -translate-x-1/2 rounded-full bg-line sm:hidden" aria-hidden="true">
            <motion.span className="block h-full w-full origin-top rounded-full bg-[linear-gradient(180deg,#3f7a5a,#c68642)]" style={{ scaleY: line }} />
          </span>
          <ol className="relative grid gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {steps.map(({ Icon, title, body, tint }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
                className="group flex items-start gap-5 text-left sm:flex-col sm:items-center sm:gap-0 sm:text-center"
              >
                <span className="relative shrink-0">
                  <motion.span
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.06 }}
                    transition={{ duration: 0.6 }}
                    className={`relative z-10 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${tint} text-fg shadow-lift ring-4 ring-bg sm:h-24 sm:w-24`}
                  >
                    <Icon strokeWidth={1.8} className="size-6 sm:size-[34px]" aria-hidden="true" />
                  </motion.span>
                  <span className="absolute -right-1.5 -top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] font-display text-xs font-bold text-[#3a1f0c] shadow sm:-right-1 sm:-top-1 sm:h-8 sm:w-8 sm:text-sm">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0 pt-1 sm:pt-0">
                  <h3 className="text-xl font-semibold text-fg sm:mt-6 sm:text-2xl">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted sm:mx-auto sm:mt-2 sm:max-w-xs">{body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-5 md:grid-cols-2">
          {[
            { title: c.do, list: c.dos, Icon: Check, cls: 'bg-leaf/10 text-leaf', ring: 'border-leaf/25' },
            { title: c.dont, list: c.donts, Icon: X, cls: 'bg-[#dc2626]/10 text-[#dc2626] dark:text-[#fca5a5]', ring: 'border-[#dc2626]/20' },
          ].map(({ title, list, Icon, cls, ring }, k) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: k === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: EASE }}
              className={`rounded-[1.75rem] border bg-card p-6 shadow-soft ${ring}`}
            >
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-fg">{title}</h3>
              <ul className="mt-4 space-y-3">
                {list.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-fg">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${cls}`}>
                      <Icon size={14} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
