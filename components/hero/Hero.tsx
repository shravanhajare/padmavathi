'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { CHAPTERS, chapterIndexAt } from '@/components/three/hero/chapters';
import { detectPerfTier, hasWebGL, type PerfTier } from '@/lib/device';
import { useThemeStore } from '@/store/theme';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { HeroLoader } from '@/components/hero/HeroLoader';
import { WoodShaving } from '@/components/ui/Kolam';
import { scrollToTarget } from '@/lib/scroll';
import { selectShopCategory } from '@/lib/events';
import type { Category } from '@/data/categories';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';

const HeroCanvas = dynamic(() => import('@/components/three/hero/HeroCanvas'), { ssr: false });

type Mode = 'pending' | 'scroll' | 'still' | 'fallback';

const EASE = [0.16, 1, 0.3, 1] as const;

/** The four story chapters; their text lives in i18n (`t.home.hero.story[id]`). */
const STORY: Array<{ id: 'carve' | 'set' | 'crate' | 'scraper'; n: string; category: Category['id'] }> = [
  { id: 'carve', n: '01', category: 'rolling' },
  { id: 'set', n: '02', category: 'rolling' },
  { id: 'crate', n: '03', category: 'spatulas' },
  { id: 'scraper', n: '04', category: 'scrapers' },
];

function goToShop(category?: Category['id']) {
  if (category) selectShopCategory(category);
  scrollToTarget('#shop');
}

/** Fills the phone rail: each segment runs from its chapter's entry to the next one's. */
function fillSegments(root: HTMLElement, p: number) {
  root.querySelectorAll<HTMLElement>('[data-seg]').forEach((el, i) => {
    const start = i === 0 ? 0 : CHAPTERS[i].in - 0.02;
    const end = i < CHAPTERS.length - 1 ? CHAPTERS[i + 1].in - 0.02 : 1;
    el.style.transform = `scaleX(${Math.min(1, Math.max(0, (p - start) / (end - start)))})`;
  });
}

/** Phones: where you are in the story, a way to jump or skip, and a CTA that follows the chapter. */
function MobileStoryBar({ chapter, visible, onJump }: { chapter: number; visible: boolean; onJump: (anchor: number) => void }) {
  const t = useT();
  const h = t.home.hero;
  const story = STORY[chapter - 1];
  const last = chapter === CHAPTERS.length - 1;
  return (
    <div
      className={cn(
        'absolute inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-3 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:hidden',
        visible ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <div className="w-full max-w-[22rem] rounded-2xl border border-line bg-surface/75 px-3.5 pb-2 pt-2.5 shadow-soft backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.2em]" aria-live="polite">
            <span className="font-display text-sm tracking-normal text-wood tabular-nums">
              {String(chapter + 1).padStart(2, '0')}
              <span className="text-muted">/{String(CHAPTERS.length).padStart(2, '0')}</span>
            </span>
            <span className="truncate text-fg">{h.chapters[CHAPTERS[chapter].id]}</span>
          </p>
          {chapter === 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">
              {h.scroll} <ChevronDown size={13} className="animate-bounce" aria-hidden="true" />
            </span>
          ) : (
            !last && (
              <button
                type="button"
                onClick={() => scrollToTarget('#shop')}
                className="-my-1.5 -mr-1.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted active:text-fg"
              >
                {h.skip} <ChevronDown size={13} aria-hidden="true" />
              </button>
            )
          )}
        </div>
        <ol className="mt-1 flex gap-1.5" aria-label={h.chaptersNav}>
          {CHAPTERS.map((c, i) => (
            <li key={c.id} className="flex-1">
              <button
                type="button"
                onClick={() => onJump(c.anchor)}
                aria-label={h.jumpTo(h.chapters[c.id])}
                aria-current={chapter === i ? 'step' : undefined}
                className="block w-full py-2"
              >
                <span className="block h-[3px] overflow-hidden rounded-full bg-line">
                  <span
                    data-seg
                    style={{ transform: 'scaleX(0)' }}
                    className="block h-full origin-left rounded-full bg-[linear-gradient(90deg,#3f7a5a,#c68642)]"
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className={cn('transition-opacity duration-500', last && 'pointer-events-none opacity-0')}>
        <Button size="lg" onClick={() => goToShop(story?.category)} className="shadow-lift" aria-hidden={last} tabIndex={last ? -1 : undefined}>
          <motion.span
            key={story?.id ?? 'all'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="inline-flex items-center gap-2"
          >
            {story ? h.story[story.id].cta : h.shopNow} <ArrowRight size={18} aria-hidden="true" />
          </motion.span>
        </Button>
      </div>
    </div>
  );
}

function FallbackArt() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[10vh] lg:items-center lg:justify-end lg:pb-0 lg:pr-[6vw]">
      <div className="relative h-[46vh] w-[46vh] max-w-[90vw] lg:h-[62vh] lg:w-[62vh]">
        <Image src="/images/products/teak-chakla-belan-set.webp" alt="" fill priority sizes="60vh" className="object-contain" />
        <Image src="/images/products/neem-mathani.webp" alt="" width={240} height={240} className="absolute -left-10 top-2 w-[38%] animate-float" />
        <Image
          src="/images/products/seat-style-coconut-scraper.webp"
          alt=""
          width={240}
          height={240}
          className="absolute -right-8 bottom-4 w-[40%] animate-float [animation-delay:-3s]"
        />
      </div>
    </div>
  );
}

export function Hero() {
  const t = useT();
  const h = t.home.hero;
  const reduce = useReducedMotion();
  const theme = useThemeStore((s) => s.resolved);
  const setHeroReady = useUIStore((s) => s.setHeroReady);
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [env, setEnv] = useState<{ webgl: boolean; tier: PerfTier } | null>(null);
  const [loadProgress, setLoadProgress] = useState(0.1);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    setEnv({ webgl: hasWebGL(), tier: detectPerfTier() });
  }, []);

  const mode: Mode = !env ? 'pending' : !env.webgl ? 'fallback' : reduce ? 'still' : 'scroll';

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '100px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onReady = useCallback(() => {
    setReady(true);
    setHeroReady(true);
  }, [setHeroReady]);

  useGSAP(
    () => {
      if (mode !== 'scroll' || !sectionRef.current) return;
      const section = sectionRef.current;
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          progressRef.current = self.progress;
          fillSegments(section, self.progress);
          const idx = chapterIndexAt(self.progress);
          setChapter((prev) => (prev === idx ? prev : idx));
        },
      });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      for (const c of CHAPTERS) {
        const el = section.querySelector<HTMLElement>(`[data-chapter="${c.id}"]`);
        if (!el) continue;
        const inner = el.querySelectorAll('[data-reveal]');
        if (c.id === 'intro') {
          tl.to(el, { autoAlpha: 0, y: -70, duration: 0.05, ease: 'power2.in' }, c.out - 0.04);
          continue;
        }
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.012 }, c.in);
        tl.fromTo(inner, { y: 46, opacity: 0, filter: 'blur(6px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.04, stagger: 0.006, ease: 'power3.out' }, c.in);
        if (c.out < 1) {
          tl.to(inner, { y: -40, opacity: 0, duration: 0.03, stagger: 0.003, ease: 'power2.in' }, c.out - 0.035);
          tl.to(el, { autoAlpha: 0, duration: 0.005 }, c.out);
        }
      }
      tl.to(section.querySelectorAll('[data-scroll-hint]'), { autoAlpha: 0, duration: 0.02 }, 0.005);
      // the big chapter numeral drifts as you scroll, a subtle parallax
      tl.fromTo(section.querySelectorAll('[data-numeral]'), { yPercent: 20 }, { yPercent: -20, duration: 1 }, 0);
      tl.set({}, {}, 1);
      return () => {
        trigger.kill();
      };
    },
    { scope: sectionRef, dependencies: [mode] },
  );

  const jumpTo = (anchor: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    scrollToTarget(top + anchor * (section.offsetHeight - window.innerHeight), { duration: 1.8 });
  };

  const scrollMode = mode === 'scroll' || mode === 'pending';

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label={h.aria}
      className={cn('relative', scrollMode ? 'h-[560vh] md:h-[620vh]' : 'h-[100svh] min-h-[640px]')}
    >
      <div className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden">
        {/* matches the 3D backdrop so there is no flash before WebGL paints */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--hero-b),var(--hero-a)_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_68%_48%,rgb(255_222_170/0.6),transparent_70%)] dark:bg-[radial-gradient(60%_55%_at_68%_48%,rgb(120_60_40/0.4),transparent_70%)]" />

        {env && mode !== 'fallback' && (
          <div className={cn('absolute inset-0 transition-opacity duration-1000', ready ? 'opacity-100' : 'opacity-0')}>
            <HeroCanvas
              progress={progressRef}
              theme={theme}
              tier={env.tier}
              still={mode === 'still'}
              active={active}
              onLoadProgress={setLoadProgress}
              onReady={onReady}
            />
          </div>
        )}
        {mode === 'fallback' && <FallbackArt />}
        {mode !== 'fallback' && <HeroLoader progress={loadProgress} visible={!ready} label={h.loader} />}

        {/* legibility scrims for the copy */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[52%] bg-gradient-to-b from-bg/90 via-bg/55 to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-bg" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-[radial-gradient(70%_55%_at_20%_50%,var(--bg)_0%,transparent_75%)] opacity-85 lg:block" />

        {/* drifting shavings in the foreground */}
        {mode === 'scroll' && (
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
            <WoodShaving className="absolute left-[3%] top-[22%] h-10 w-12 animate-sway opacity-70" />
            <WoodShaving className="absolute left-[40%] top-[78%] h-8 w-10 animate-sway opacity-60 [animation-delay:-2s]" variant={1} />
            <WoodShaving className="absolute left-[46%] top-[16%] h-7 w-8 animate-sway opacity-50 [animation-delay:-4s]" variant={2} />
          </div>
        )}

        <div className="container-page relative z-10 h-full">
          {/* Intro */}
          <div
            data-chapter="intro"
            className="absolute inset-x-4 top-24 text-center sm:inset-x-6 lg:inset-x-8 lg:top-1/2 lg:max-w-[38rem] lg:-translate-y-1/2 lg:text-left"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8, ease: EASE }}
              className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-wood backdrop-blur sm:text-[0.68rem] sm:tracking-[0.26em]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden="true" />
              {h.eyebrow}
            </motion.p>
            <h1 className="text-[2.75rem] font-semibold leading-[0.98] text-fg sm:text-6xl lg:text-[4.7rem]">
              <span className="sr-only">{h.eyebrow}: </span>
              {h.words.map((w, i) => (
                <span key={w} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className={cn('inline-block', i > 0 && 'text-gradient-wood italic pr-2')}
                    initial={{ y: '105%', rotate: 3 }}
                    animate={{ y: '0%', rotate: 0 }}
                    transition={{ delay: 0.25 + i * 0.12, duration: 1, ease: EASE }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8, ease: EASE }}
              className="mx-auto mt-5 max-w-md text-[1.02rem] leading-relaxed text-muted sm:text-lg lg:mx-0"
            >
              {h.sub} {mode === 'scroll' && <span className="hidden sm:inline">{h.subScroll}</span>}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: EASE }}
              className="mt-8 hidden flex-wrap items-center gap-3 sm:flex sm:justify-center lg:justify-start"
            >
              <Button size="lg" magnetic onClick={() => goToShop()}>
                {h.shopNow} <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToTarget('#gift-sets')}>
                {h.giftSets}
              </Button>
            </motion.div>
            {scrollMode && (
              <p data-scroll-hint className="mt-8 hidden items-center gap-3 text-sm font-medium text-muted lg:inline-flex">
                <span className="relative grid h-9 w-6 justify-center rounded-full border-2 border-line-strong pt-1.5" aria-hidden="true">
                  <span className="pe-scroll-dot block h-2 w-1 rounded-full bg-forest" />
                </span>
                {h.scrollHint}
              </p>
            )}
          </div>

          {/* Story chapters (scroll mode only) */}
          {scrollMode &&
            STORY.map((s) => (
              <div
                key={s.id}
                data-chapter={s.id}
                style={{ opacity: 0, visibility: 'hidden' }}
                className="absolute inset-x-4 top-24 text-center sm:inset-x-6 lg:inset-x-8 lg:top-1/2 lg:max-w-[32rem] lg:-translate-y-1/2 lg:text-left"
              >
                <span
                  data-numeral
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-[9.5rem] -left-4 -z-10 hidden font-display text-[10rem] font-bold leading-none text-transparent [-webkit-text-stroke:1.2px_var(--border-strong)] lg:block"
                >
                  {s.n}
                </span>
                <p data-reveal className="flex items-center justify-center gap-3 lg:justify-start">
                  <span className="font-display text-4xl font-semibold text-wood sm:text-5xl">{s.n}</span>
                  <span className="h-px w-8 bg-honey" aria-hidden="true" />
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted">{h.story[s.id].label}</span>
                </p>
                <h2 data-reveal className="mt-3 text-[2.4rem] font-semibold leading-[1.02] text-fg sm:text-6xl lg:text-[4rem]">
                  {h.story[s.id].title}
                </h2>
                <p data-reveal className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
                  {h.story[s.id].body}
                </p>
                <ul data-reveal className="mt-4 flex flex-wrap justify-center gap-1.5 sm:mt-5 sm:gap-2 lg:justify-start">
                  {h.story[s.id].items.map((it) => (
                    <li key={it} className="rounded-full border border-line bg-surface/70 px-2.5 py-0.5 text-[0.7rem] font-medium text-fg backdrop-blur sm:px-3 sm:py-1 sm:text-xs">
                      {it}
                    </li>
                  ))}
                </ul>
                <div data-reveal className="mt-6 hidden lg:block">
                  <button type="button" onClick={() => goToShop(s.category)} className="group inline-flex items-center gap-2 text-sm font-semibold text-accent">
                    {h.story[s.id].cta}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}

          {/* Finale */}
          {scrollMode && (
            <div
              data-chapter="finale"
              style={{ opacity: 0, visibility: 'hidden' }}
              className="absolute inset-x-4 top-24 text-center sm:inset-x-6 lg:inset-x-8 lg:top-[44%] lg:max-w-[30rem] lg:-translate-y-1/2 lg:text-left"
            >
              <p data-reveal className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-wood">
                {h.finale.eyebrow}
              </p>
              <h2 data-reveal className="mt-3 text-[2.4rem] font-semibold leading-[1.02] text-fg sm:text-6xl lg:text-[4.3rem]">
                {h.finale.title} <span className="text-gradient-wood italic">{h.finale.accent}</span>
              </h2>
              <p data-reveal className="mx-auto mt-4 hidden max-w-md text-base leading-relaxed text-muted sm:block sm:text-lg lg:mx-0">
                {h.finale.body}
              </p>
              <div data-reveal className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-7 sm:gap-3 lg:justify-start">
                <Button size="lg" magnetic onClick={() => goToShop()} className="max-sm:h-12 max-sm:px-5 max-sm:text-[0.92rem]">
                  {h.shopNow} <ArrowRight size={18} aria-hidden="true" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollToTarget('#gift-sets')} className="max-sm:h-12 max-sm:px-5 max-sm:text-[0.92rem]">
                  {h.giftSets}
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Phones: story progress + a CTA that follows the chapter */}
        {scrollMode ? (
          <MobileStoryBar chapter={chapter} visible={ready} onJump={jumpTo} />
        ) : (
          <div className="absolute inset-x-4 bottom-6 z-10 flex justify-center sm:hidden">
            <Button size="lg" onClick={() => goToShop()} className="shadow-lift">
              {h.shopNow} <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Chapter rail */}
        {scrollMode && (
          <nav aria-label={h.chaptersNav} className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
            <ol className="flex flex-col items-end gap-3.5">
              {CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(c.anchor)}
                    aria-label={h.jumpTo(h.chapters[c.id])}
                    aria-current={chapter === i ? 'step' : undefined}
                    className="group flex items-center gap-3 rounded-full py-0.5"
                  >
                    <span
                      className={cn(
                        'text-[0.68rem] font-semibold uppercase tracking-[0.2em] transition-all duration-300',
                        chapter === i ? 'text-fg opacity-100' : 'translate-x-2 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                      )}
                    >
                      {h.chapters[c.id]}
                    </span>
                    <span
                      className={cn(
                        'block rounded-full transition-all duration-500',
                        chapter === i ? 'h-6 w-1.5 bg-[linear-gradient(180deg,#3f7a5a,#c68642)]' : 'h-1.5 w-1.5 bg-line-strong group-hover:bg-honey',
                      )}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {scrollMode && (
          <button
            type="button"
            onClick={() => scrollToTarget('#shop')}
            className="absolute bottom-6 left-5 z-10 hidden items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3.5 py-2 text-xs font-semibold text-muted backdrop-blur transition-colors hover:text-fg sm:inline-flex"
          >
            {h.skipStory} <ChevronDown size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
