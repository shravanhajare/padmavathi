'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Languages } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/client';
import { LOCALE_META, LOCALES } from '@/i18n/config';
import { cn } from '@/lib/utils';

/** Header pill: current language, opens a small menu of the three. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t, switching } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.common.lang.choose}: ${LOCALE_META[locale].label}`}
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface/70 px-3 text-[0.82rem] font-semibold text-fg transition-colors hover:border-honey',
          switching && 'opacity-60',
        )}
      >
        <Languages size={16} aria-hidden="true" />
        <span className="min-w-[1.1rem] text-center">{LOCALE_META[locale].short}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-50 w-44 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
          >
            {LOCALES.map((l) => (
              <li key={l} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={l === locale}
                  lang={LOCALE_META[l].htmlLang}
                  onClick={() => {
                    setOpen(false);
                    if (l !== locale) setLocale(l);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[0.95rem] transition-colors',
                    l === locale ? 'bg-surface-2 font-semibold text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                  )}
                >
                  {LOCALE_META[l].label}
                  {l === locale && <Check size={16} className="text-leaf" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Big three-way switch for the phone menu. */
export function LanguageSegments({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t.common.lang.choose} className={cn('grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface/70 p-1', className)}>
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            lang={LOCALE_META[l].htmlLang}
            onClick={() => !active && setLocale(l)}
            className={cn('relative rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors', active ? 'text-[#3a1f0c]' : 'text-muted')}
          >
            {active && (
              <motion.span layoutId="lang-seg" className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,#f6d9a6,#e2a867)]" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />
            )}
            <span className="relative">{LOCALE_META[l].label}</span>
          </button>
        );
      })}
    </div>
  );
}
