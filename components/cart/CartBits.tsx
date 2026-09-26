'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown, Minus, Plus, Trash2, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { getProduct, products } from '@/data/products';
import { MAX_QTY, useCartStore, type ResolvedLine } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { computeTotals, PRICING, ZONES, type Totals } from '@/lib/pricing';
import { tintClasses, tintStyle, WoodChip } from '@/components/shop/parts';
import { cn, formatINR } from '@/lib/utils';

/** Empty-cart illustration: a wooden spoon stirring an empty bowl, a wisp of steam rising. */
export function EmptySpoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 180" className={cn('h-40 w-48', className)} aria-hidden="true">
      <defs>
        <linearGradient id="es-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9b877" />
          <stop offset="0.55" stopColor="#c68642" />
          <stop offset="1" stopColor="#8f4a24" />
        </linearGradient>
        <linearGradient id="es-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b06a36" />
          <stop offset="1" stopColor="#5c3a21" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="164" rx="70" ry="8" fill="rgb(92 58 33 / 0.14)" />
      {/* steam */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${92 + i * 18} 70 C ${86 + i * 18} 58, ${100 + i * 18} 50, ${92 + i * 18} 36`}
          fill="none"
          stroke="#e9c38f"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 0.8, 0], y: [8, -6, -16] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
        />
      ))}
      {/* the spoon stirs in slow circles */}
      <motion.g
        style={{ originX: '110px', originY: '112px' }}
        animate={{ rotate: [-10, 12, -10], x: [-6, 8, -6] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="136" y="18" width="9" height="92" rx="4.5" fill="url(#es-wood)" transform="rotate(24 140 64)" />
        <ellipse cx="118" cy="106" rx="14" ry="20" fill="url(#es-wood)" transform="rotate(24 118 106)" />
        <ellipse cx="116" cy="103" rx="7" ry="12" fill="#fff3dc" opacity="0.35" transform="rotate(24 116 103)" />
      </motion.g>
      {/* bowl */}
      <path d="M40 104 H180 C 178 140, 150 160, 110 160 C 70 160, 42 140, 40 104 Z" fill="url(#es-bowl)" />
      <ellipse cx="110" cy="104" rx="70" ry="12" fill="#8f4a24" />
      <ellipse cx="110" cy="104" rx="62" ry="8" fill="#3b2415" />
      <path d="M52 118 C 60 138, 80 150, 110 152" fill="none" stroke="#fff3dc" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function QtyStepper({ line, size = 'sm' }: { line: ResolvedLine; size?: 'sm' | 'md' }) {
  const setQty = useCartStore((s) => s.setQty);
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="flex items-center rounded-full border border-line-strong bg-surface-2/60">
      <span className="hidden pl-3 text-xs font-semibold text-muted sm:inline">Qty</span>
      <button
        type="button"
        onClick={() => setQty(line.key, line.qty - 1)}
        aria-label={line.qty === 1 ? `Remove ${line.name}` : `Decrease ${line.name}`}
        className={cn('grid place-items-center rounded-full hover:bg-surface', btn)}
      >
        <Minus size={14} />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-label={`Quantity ${line.qty}`}>
        {line.qty}
      </span>
      <button
        type="button"
        onClick={() => setQty(line.key, line.qty + 1)}
        disabled={line.qty >= MAX_QTY}
        aria-label={`Increase ${line.name}`}
        className={cn('grid place-items-center rounded-full hover:bg-surface disabled:opacity-40', btn)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

/** Lets a line switch size in place (merges with an existing line of that size). */
export function LineVariantSelect({ line }: { line: ResolvedLine }) {
  const setVariant = useCartStore((s) => s.setVariant);
  const product = getProduct(line.productId);
  if (!product || product.variants.length < 2) return <p className="text-xs text-muted">{line.variantLabel}</p>;
  return (
    <label className="relative inline-flex max-w-full self-start">
      <span className="sr-only">Size of {line.name}</span>
      <select
        value={line.variantId}
        onChange={(e) => setVariant(line.key, e.target.value)}
        className="h-8 max-w-full appearance-none truncate rounded-full border border-line bg-surface pl-3 pr-8 text-xs font-semibold text-fg outline-none focus:border-forest"
      >
        {product.variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
    </label>
  );
}

export function LineItem({ line }: { line: ResolvedLine }) {
  const remove = useCartStore((s) => s.remove);
  const product = getProduct(line.productId)!;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4 border-b border-line py-4 last:border-b-0"
    >
      <div style={tintStyle(product)} className={cn('relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl', tintClasses)}>
        <Image src={line.image} alt="" fill sizes="80px" className="object-contain p-1.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-[1.05rem] font-semibold text-fg">{line.name}</p>
            <p className="text-xs text-muted">{formatINR(line.price)} each</p>
          </div>
          <button
            type="button"
            onClick={() => remove(line.key)}
            aria-label={`Remove ${line.name} from cart`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-accent"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <LineVariantSelect line={line} />
        <div className="mt-auto flex items-center justify-between pt-1">
          <QtyStepper line={line} />
          <p className="font-semibold tabular-nums text-fg">{formatINR(line.lineTotal)}</p>
        </div>
      </div>
    </motion.li>
  );
}

export function FreeDeliveryMeter({ totals }: { totals: Totals }) {
  const progress = Math.min(1, totals.subtotal / ZONES.ship.freeAbove);
  return (
    <div className="rounded-2xl border border-line bg-surface-2/60 p-3.5">
      <p className="flex items-center gap-2 text-sm text-fg">
        <Truck size={16} className="text-accent" aria-hidden="true" />
        {totals.freeDeliveryGap > 0 ? (
          <span>
            Add <span className="font-semibold">{formatINR(totals.freeDeliveryGap)}</span> more for free delivery across India
          </span>
        ) : (
          <span className="font-semibold text-leaf">You’ve unlocked free delivery</span>
        )}
      </p>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Progress towards free delivery"
      >
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,#3f7a5a,#c68642,#facc15)]"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function TotalsList({ totals, className }: { totals: Totals; className?: string }) {
  return (
    <dl className={cn('space-y-2 text-sm', className)}>
      <div className="flex justify-between text-muted">
        <dt>Subtotal</dt>
        <dd className="tabular-nums text-fg">{formatINR(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>Delivery</dt>
        <dd className="tabular-nums text-fg">{totals.delivery === 0 ? 'Free' : formatINR(totals.delivery)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>GST ({Math.round(PRICING.gstRate * 100)}%)</dt>
        <dd className="tabular-nums text-fg">{formatINR(totals.tax)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-fg">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatINR(totals.total)}</dd>
      </div>
    </dl>
  );
}

export function useCartTotals(lines: ResolvedLine[]) {
  return useMemo(() => computeTotals(lines), [lines]);
}

/** "You may also like": bestsellers not already in the cart, added in one tap. */
export function Suggestions({ exclude, layout = 'grid', limit = 3 }: { exclude: Set<string>; layout?: 'grid' | 'list'; limit?: number }) {
  const pushToast = useUIStore((s) => s.pushToast);
  const add = useCartStore((s) => s.add);
  const bump = useUIStore((s) => s.bumpCart);
  const picks = useMemo(
    () =>
      products
        .filter((p) => p.tags.includes('bestseller') && !exclude.has(p.id) && p.category !== 'gifts')
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit),
    [exclude, limit],
  );
  if (!picks.length) return null;
  const addOne = (id: string) => {
    const p = products.find((x) => x.id === id)!;
    add(p.id, p.variants[0].id);
    bump();
    pushToast({ name: p.name, variantLabel: p.variants[0].label, image: p.image, qty: 1 });
  };
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-wood">You may also like</p>
      {layout === 'grid' ? (
        <ul className="grid grid-cols-3 gap-2.5">
          {picks.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => addOne(p.id)}
                className="group flex w-full flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface-2/50 p-2 text-center transition-colors hover:border-honey"
                aria-label={`Add ${p.name}, ${p.variants[0].label}, ${formatINR(p.variants[0].price)}`}
              >
                <span style={tintStyle(p)} className={cn('relative block aspect-square w-full overflow-hidden rounded-xl', tintClasses)}>
                  <Image src={p.image} alt="" fill sizes="96px" className="object-contain p-1 transition-transform group-hover:scale-105" />
                  <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-[#2c5a42] text-white shadow">
                    <Plus size={14} />
                  </span>
                </span>
                <span className="line-clamp-1 text-[0.72rem] font-semibold text-fg">{p.name}</span>
                <span className="text-[0.7rem] text-muted">{formatINR(p.variants[0].price)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {picks.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
              <span style={tintStyle(p)} className={cn('relative h-16 w-16 shrink-0 overflow-hidden rounded-xl', tintClasses)}>
                <Image src={p.image} alt="" fill sizes="64px" className="object-contain p-1" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[1.02rem] font-semibold text-fg">{p.name}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <WoodChip wood={p.wood} className="text-[0.62rem]" /> {formatINR(p.variants[0].price)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => addOne(p.id)}
                aria-label={`Add ${p.name} to cart`}
                className="grid h-9 w-9 shrink-0 place-items-center btn-wood btn-wood-teak rounded-full hover:scale-105"
              >
                <Plus size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
