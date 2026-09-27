'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CATEGORIES, WOODS, type Category } from '@/data/categories';
import { lowestPrice } from '@/lib/catalog';
import { useCatalog } from '@/components/layout/AppData';
import { useT } from '@/i18n/client';
import type { WoodId } from '@/data/types';
import { CATEGORY_EVENT } from '@/lib/events';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Kolam, WoodShaving } from '@/components/ui/Kolam';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'newest' | 'name';

const SORTS: SortKey[] = ['popular', 'price-asc', 'price-desc', 'newest', 'name'];

function CategoryTabs({ value, onChange, counts }: { value: Category['id']; onChange: (id: Category['id']) => void; counts: Record<string, number> }) {
  const t = useT();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  // only categories that have something in them
  const cats = CATEGORIES.filter((c) => c.id === 'all' || (counts[c.id] ?? 0) > 0);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const n = cats.length;
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
    refs.current[next]?.focus();
    onChange(cats[next].id);
  };
  return (
    <div className="relative -mx-4 lg:mx-0">
      <div role="tablist" aria-label={t.catalog.shop.tabs} className="scrollbar-none flex gap-0.5 overflow-x-auto px-4 pb-1.5 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0">
        {cats.map((c, i) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`tab-${c.id}`}
              aria-selected={active}
              aria-controls="shop-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(c.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                'relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-2.5 text-[0.86rem] font-medium transition-colors xl:px-4',
                active ? 'text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {active && (
                <motion.span
                  layoutId="shop-tab"
                  className="absolute inset-0 rounded-full border border-line bg-surface shadow-soft"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative inline-flex items-center gap-2">
                {t.catalog.categories[c.id]}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[0.64rem] font-semibold tabular-nums transition-colors',
                    active ? 'bg-sage/45 text-forest-deep dark:bg-forest/25' : 'bg-line text-muted',
                  )}
                >
                  {counts[c.id] ?? 0}
                </span>
              </span>
              {active && (
                <motion.span
                  layoutId="shop-tab-line"
                  className="absolute inset-x-5 -bottom-[3px] h-[2.5px] rounded-full bg-[linear-gradient(90deg,#3f7a5a,#c68642)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WoodFilter({ value, onChange }: { value: WoodId | 'all'; onChange: (w: WoodId | 'all') => void }) {
  const t = useT();
  const options: Array<{ id: WoodId | 'all'; label: string; swatch?: [string, string] }> = [
    { id: 'all', label: t.catalog.shop.allWoods },
    ...WOODS.map((w) => ({ id: w.id, label: t.catalog.woods[w.id].label, swatch: w.swatch })),
  ];
  return (
    <div role="radiogroup" aria-label={t.catalog.shop.woodFilter} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[0.82rem] font-semibold transition-colors',
              active ? 'border-transparent text-[#3a1f0c]' : 'border-line-strong bg-surface/70 text-muted hover:border-honey hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId="wood-filter"
                className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] shadow-[0_6px_16px_-8px_rgb(198_134_66/0.9)]"
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              />
            )}
            {o.swatch && (
              <span
                aria-hidden="true"
                className="relative h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                style={{ background: `repeating-linear-gradient(100deg, ${o.swatch[0]} 0 3px, ${o.swatch[1]} 3px 4px)` }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Shop() {
  const t = useT();
  const { products } = useCatalog();
  const [category, setCategory] = useState<Category['id']>('all');
  const [wood, setWood] = useState<WoodId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');

  useEffect(() => {
    const onCategory = (e: Event) => {
      setCategory((e as CustomEvent<Category['id']>).detail);
      setQuery('');
      setWood('all');
    };
    window.addEventListener(CATEGORY_EVENT, onCategory);
    return () => window.removeEventListener(CATEGORY_EVENT, onCategory);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    for (const p of products) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [products]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (wood !== 'all' && p.wood !== wood) return false;
      if (!q) return true;
      const words = [p.name, p.localName ?? '', p.description, p.wood, t.catalog.woods[p.wood].label, t.catalog.categories[p.category], ...(p.includes ?? [])];
      return words.some((s) => s.toLowerCase().includes(q));
    });
    const sorted = [...filtered];
    if (sort === 'popular') sorted.sort((a, b) => b.popularity - a.popularity);
    if (sort === 'price-asc') sorted.sort((a, b) => lowestPrice(a) - lowestPrice(b));
    if (sort === 'price-desc') sorted.sort((a, b) => lowestPrice(b) - lowestPrice(a));
    if (sort === 'newest') sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, category, wood, query, sort, t]);

  const activeLabel = t.catalog.categories[category];

  return (
    <section id="shop" aria-labelledby="shop-title" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <Kolam className="absolute -left-52 top-28 h-[36rem] w-[36rem] text-honey/15" spin />
      <Kolam className="absolute -right-60 bottom-10 h-[40rem] w-[40rem] text-forest/[0.07]" petals={16} />
      <WoodShaving className="absolute right-[8%] top-40 h-12 w-14 animate-sway opacity-70" />
      <div className="container-page relative">
        <SectionHeading
          id="shop-title"
          eyebrow={t.catalog.shop.eyebrow}
          title={t.catalog.shop.title}
          accent={t.catalog.shop.accent}
          subtitle={t.catalog.shop.subtitle}
        />

        <div className="mt-12 flex flex-col gap-5">
          <CategoryTabs value={category} onChange={setCategory} counts={counts} />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="group relative flex h-12 w-full items-center lg:max-w-xs">
              <span className="sr-only">{t.catalog.shop.search}</span>
              <Search size={18} className="pointer-events-none absolute left-4 z-10 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.catalog.shop.searchPlaceholder}
                className="h-full w-full rounded-full border border-line-strong bg-surface/80 pl-11 pr-11 text-[0.95rem] text-fg shadow-soft outline-none backdrop-blur transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-forest focus:shadow-[0_0_0_4px_rgb(63_122_90/0.15)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t.catalog.shop.clearSearch}
                  className="absolute right-3 grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <WoodFilter value={wood} onChange={setWood} />
            <label className="relative flex h-12 shrink-0 items-center">
              <span className="sr-only">{t.catalog.shop.sortLabel}</span>
              <ArrowUpDown size={16} className="pointer-events-none absolute left-4 z-10 text-muted" aria-hidden="true" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-full w-full appearance-none rounded-full border border-line-strong bg-surface/80 pl-10 pr-6 text-sm font-medium text-fg shadow-soft outline-none backdrop-blur focus:border-forest lg:w-auto"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t.catalog.shop.sorts[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {t.catalog.shop.showing(list.length, activeLabel)}
            {wood !== 'all' && t.catalog.shop.madeOf(t.catalog.woods[wood].label)}
          </p>
        </div>

        <div id="shop-panel" role="tabpanel" aria-labelledby={`tab-${category}`} className="mt-8">
          <LayoutGroup>
            <motion.div layout className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {list.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
          {list.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
              <WoodShaving className="h-14 w-16 animate-sway" />
              <p className="font-display text-2xl text-fg">{t.catalog.shop.emptyTitle(query)}</p>
              <p className="text-muted">{t.catalog.shop.emptyBody}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                  setWood('all');
                }}
                className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-fg hover:border-honey"
              >
                {t.catalog.shop.showAll}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
