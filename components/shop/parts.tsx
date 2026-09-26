'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Leaf, ShieldCheck, Sparkles, Star, Gift, Hand } from 'lucide-react';
import { useRef, useState, type CSSProperties } from 'react';
import type { Product, ProductTag, WoodId } from '@/data/types';
import { categoryById, woodById } from '@/data/categories';
import { useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { cn, formatINR } from '@/lib/utils';

export function tintStyle(product: Pick<Product, 'category'>): CSSProperties {
  const t = categoryById[product.category].tint;
  return { '--ta': t.light[0], '--tb': t.light[1], '--tda': t.dark[0], '--tdb': t.dark[1] } as CSSProperties;
}

export const tintClasses =
  'bg-[radial-gradient(circle_at_50%_38%,var(--ta)_0%,var(--tb)_100%)] dark:bg-[radial-gradient(circle_at_50%_38%,var(--tda)_0%,var(--tdb)_100%)]';

const BADGES: Partial<Record<ProductTag, { label: string; cls: string; Icon: typeof Star }>> = {
  bestseller: { label: 'Bestseller', cls: 'bg-[#be185d] text-white', Icon: Star },
  new: { label: 'New', cls: 'bg-[#5c3a21] text-[#fff7e0]', Icon: Sparkles },
  gift: { label: 'Gift', cls: 'bg-[#facc15] text-[#5c3a21]', Icon: Gift },
  handmade: { label: 'Handmade', cls: 'bg-white/90 text-[#5c3a21] ring-1 ring-[#c68642]/40', Icon: Hand },
  'food-safe': { label: 'Food-safe', cls: 'bg-white/90 text-[#2f7d3a] ring-1 ring-[#2f7d3a]/30', Icon: ShieldCheck },
};

/** Up to `max` badges, most important first. `fluid` hides extras on narrow cards (container query). */
export function ProductBadges({ product, className, max = 2, fluid = false }: { product: Product; className?: string; max?: number; fluid?: boolean }) {
  const order: ProductTag[] = ['bestseller', 'new', 'gift', 'handmade', 'food-safe'];
  const list = order.filter((t) => product.tags.includes(t)).slice(0, max);
  if (!list.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {list.map((tag, i) => {
        const b = BADGES[tag]!;
        return (
          <span
            key={tag}
            className={cn(
              'items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider shadow-sm @min-[15rem]:px-2.5 @min-[15rem]:py-1 @min-[15rem]:text-[0.62rem]',
              fluid && i > 0 ? 'hidden @min-[15rem]:inline-flex' : 'inline-flex',
              b.cls,
            )}
          >
            <b.Icon size={11} aria-hidden="true" />
            {b.label}
          </span>
        );
      })}
    </div>
  );
}

/** "Handmade · Food-safe" trust line with icons. */
export function TrustLine({ className }: { className?: string }) {
  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-medium text-muted', className)}>
      <span className="inline-flex items-center gap-1">
        <Hand size={12} className="text-honey" aria-hidden="true" /> Handmade
      </span>
      <span className="inline-flex items-center gap-1">
        <ShieldCheck size={12} className="text-leaf" aria-hidden="true" /> Food-safe
      </span>
      <span className="inline-flex items-center gap-1">
        <Leaf size={12} className="text-leaf" aria-hidden="true" /> No lacquer
      </span>
    </p>
  );
}

export function WoodChip({ wood, className }: { wood: WoodId; className?: string }) {
  const w = woodById[wood];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/70 px-2 py-0.5 text-[0.68rem] font-semibold text-fg', className)} title={w.note}>
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
        style={{ background: `repeating-linear-gradient(100deg, ${w.swatch[0]} 0 3px, ${w.swatch[1]} 3px 4px)` }}
      />
      {w.label}
    </span>
  );
}

export function VariantPicker({
  product,
  value,
  onChange,
  size = 'sm',
  fluid = false,
}: {
  product: Product;
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  /** Inside a card container: a compact dropdown when the card is narrow, chips when there's room. */
  fluid?: boolean;
}) {
  const label = `Choose a size for ${product.name}`;
  if (product.variants.length < 2) {
    return <p className={cn('font-semibold text-muted', size === 'sm' ? 'text-[0.72rem]' : 'text-sm')}>{product.variants[0].label}</p>;
  }
  return (
    <>
      {fluid && (
        <label className="relative block @min-[15rem]:hidden">
          <span className="sr-only">{label}</span>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-full appearance-none truncate rounded-full border border-line-strong bg-surface-2/70 pl-3 pr-8 text-[0.74rem] font-semibold text-fg outline-none transition-colors focus:border-pink-strong"
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        </label>
      )}
      <div role="radiogroup" aria-label={label} className={cn('flex-wrap gap-1.5', fluid ? 'hidden @min-[15rem]:flex' : 'flex')}>
        {product.variants.map((v) => {
          const active = v.id === value;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v.id)}
              className={cn(
                'relative rounded-full border font-semibold transition-colors',
                size === 'sm' ? 'min-h-[1.9rem] px-2.5 py-1 text-[0.7rem]' : 'min-h-11 px-4 py-2 text-sm',
                active ? 'border-transparent text-[#3a1f0c]' : 'border-line-strong text-muted hover:border-honey hover:text-fg',
              )}
            >
              {active && (
                <motion.span
                  layoutId={`variant-${product.id}-${size}`}
                  className="absolute inset-0 -z-0 rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              )}
              <span className="relative">{v.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {formatINR(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Adds to the cart and launches the fly-to-cart animation (or just a toast when motion is reduced). */
export function useAddToCart(product: Product) {
  const add = useCartStore((s) => s.add);
  const launchFlyer = useUIStore((s) => s.launchFlyer);
  const bumpCart = useUIStore((s) => s.bumpCart);
  const pushToast = useUIStore((s) => s.pushToast);
  const reduce = useReducedMotion();
  const [added, setAdded] = useState(false);
  const [pulse, setPulse] = useState(0);
  const timer = useRef<number>(0);
  const addToCart = (variantId: string, qty = 1, fromEl?: Element | null) => {
    const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
    add(product.id, variant.id, qty);
    const toast = { name: product.name, variantLabel: variant.label, image: product.image, qty };
    if (fromEl && !reduce) launchFlyer(product.image, fromEl, toast);
    else {
      bumpCart();
      pushToast(toast);
    }
    setAdded(true);
    setPulse((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1600);
  };
  return { addToCart, added, pulse };
}
