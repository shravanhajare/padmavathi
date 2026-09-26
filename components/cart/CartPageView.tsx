'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Lock, ShieldCheck, Trash2, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { getProduct } from '@/data/products';
import { resolveLines, useCartHydrated, useCartStore, type ResolvedLine } from '@/store/cart';
import { ButtonLink } from '@/components/ui/Button';
import { KolamBorder } from '@/components/ui/Kolam';
import { tintClasses, tintStyle, WoodChip } from '@/components/shop/parts';
import { EmptySpoon, FreeDeliveryMeter, LineVariantSelect, QtyStepper, Suggestions, TotalsList, useCartTotals } from './CartBits';
import { cn, formatINR, pluralize } from '@/lib/utils';

function LineCard({ line, index }: { line: ResolvedLine; index: number }) {
  const remove = useCartStore((s) => s.remove);
  const product = getProduct(line.productId)!;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ duration: 0.55, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4 rounded-[1.6rem] border border-line bg-card p-4 shadow-soft sm:gap-5 sm:p-5"
    >
      <div style={tintStyle(product)} className={cn('relative aspect-square w-28 shrink-0 self-start overflow-hidden rounded-2xl sm:w-36', tintClasses)}>
        <Image src={line.image} alt={product.name} fill sizes="144px" className="object-contain p-2" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-display text-lg font-semibold leading-tight text-fg sm:text-xl">
          {line.name} <span className="text-muted">×{line.qty}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <WoodChip wood={product.wood} />
          <span className="text-sm text-muted">Price: {formatINR(line.price)}</span>
        </div>
        <LineVariantSelect line={line} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <QtyStepper line={line} />
          <button
            type="button"
            onClick={() => remove(line.key)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
          >
            <Trash2 size={14} aria-hidden="true" /> Remove
          </button>
        </div>
      </div>
    </motion.li>
  );
}

export function CartPageView() {
  const hydrated = useCartHydrated();
  const rawLines = useCartStore((s) => s.lines);
  const lines = useMemo(() => resolveLines(rawLines), [rawLines]);
  const totals = useCartTotals(lines);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const inCart = useMemo(() => new Set(lines.map((l) => l.productId)), [lines]);

  if (!hydrated) {
    return (
      <div className="container-page grid gap-6 pb-24 pt-32 lg:grid-cols-[1.6fr_1fr]">
        <div className="skeleton h-[28rem] rounded-[1.75rem]" />
        <div className="skeleton h-[22rem] rounded-[1.75rem]" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[72vh] flex-col items-center justify-center gap-4 pb-24 pt-32 text-center">
        <EmptySpoon className="h-48 w-56" />
        <h1 className="text-4xl font-semibold text-fg sm:text-5xl">Your cart is empty</h1>
        <p className="max-w-md text-muted">Every kitchen deserves one good wooden spoon. Start there, and the rest follows.</p>
        <ButtonLink href="/#shop" size="lg" magnetic className="mt-2">
          Browse the collection
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="container-page pb-24 pt-28 sm:pt-32">
      <Link href="/#shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" /> Continue shopping
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-semibold text-fg sm:text-5xl">
          Your <span className="text-gradient-wood italic">cart</span>
        </h1>
        <p className="text-sm text-muted">{pluralize(count, 'piece')} ready to ship</p>
      </div>
      <KolamBorder className="mt-5 h-4 w-full max-w-md text-honey/70" loops={16} />

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <ul className="grid gap-4 xl:grid-cols-2">
          <AnimatePresence initial={false}>
            {lines.map((l, i) => (
              <LineCard key={l.key} line={l} index={i} />
            ))}
          </AnimatePresence>
        </ul>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24" aria-labelledby="cart-summary-title">
          <div className="rounded-[1.75rem] border border-line bg-card p-6 shadow-soft">
            <h2 id="cart-summary-title" className="text-xl font-semibold text-fg">
              Order summary
            </h2>
            <div className="mt-4">
              <FreeDeliveryMeter totals={totals} />
            </div>
            <TotalsList totals={totals} className="mt-5" />
            <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
              <Lock size={17} aria-hidden="true" /> Proceed to Checkout
            </ButtonLink>
            <ul className="mt-4 space-y-1.5 text-xs text-muted">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-leaf" aria-hidden="true" /> Secure payment by Razorpay: UPI, cards, netbanking, wallets
              </li>
              <li className="flex items-center gap-2">
                <Truck size={14} className="text-accent" aria-hidden="true" /> Ships across India in 3 to 6 days
              </li>
            </ul>
          </div>
          <Suggestions exclude={inCart} layout="list" limit={3} />
        </aside>
      </div>
    </div>
  );
}
