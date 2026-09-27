'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BadgeIndianRupee, MessageCircle, Trash2, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { useCartHydrated, useCartStore, type ResolvedLine } from '@/store/cart';
import { ButtonLink } from '@/components/ui/Button';
import { KolamBorder } from '@/components/ui/Kolam';
import { tintClasses, tintStyle, WoodChip } from '@/components/shop/parts';
import { useT } from '@/i18n/client';
import { EmptySpoon, LineVariantSelect, MinOrderNote, QtyStepper, Suggestions, TotalsList } from './CartBits';
import { useCart } from './useCart';
import { cn, formatINR } from '@/lib/utils';

function LineCard({ line, index }: { line: ResolvedLine; index: number }) {
  const t = useT();
  const remove = useCartStore((s) => s.remove);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ duration: 0.55, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4 rounded-[1.6rem] border border-line bg-card p-4 shadow-soft sm:gap-5 sm:p-5"
    >
      <div style={tintStyle(line.product)} className={cn('relative aspect-square w-24 shrink-0 self-start overflow-hidden rounded-2xl sm:w-36', tintClasses)}>
        <Image src={line.image} alt={line.name} fill sizes="144px" className="object-contain p-2" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-display text-lg font-semibold leading-tight text-fg sm:text-xl">{line.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <WoodChip wood={line.product.wood} />
          <span className="text-sm text-muted">{t.orders.cart.eachPrice(formatINR(line.price))}</span>
        </div>
        <LineVariantSelect line={line} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <QtyStepper line={line} />
          <span className="font-semibold tabular-nums text-fg">{formatINR(line.lineTotal)}</span>
        </div>
        <button
          type="button"
          onClick={() => remove(line.key)}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          <Trash2 size={14} aria-hidden="true" /> {t.orders.cart.remove}
        </button>
      </div>
    </motion.li>
  );
}

const NOTE_ICONS = [MessageCircle, BadgeIndianRupee, Truck];

export function CartPageView() {
  const t = useT();
  const hydrated = useCartHydrated();
  const { lines, totals, count } = useCart();
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
        <h1 className="text-4xl font-semibold text-fg sm:text-5xl">{t.orders.cart.emptyTitle}</h1>
        <p className="max-w-md text-muted">{t.orders.cart.emptyBody}</p>
        <ButtonLink href="/#shop" size="lg" magnetic className="mt-2">
          {t.orders.cart.browse}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="container-page pb-28 pt-28 sm:pt-32">
      <Link href="/#shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" /> {t.orders.cart.continueShopping}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-semibold text-fg sm:text-5xl">
          {t.orders.cart.pageTitle} <span className="text-gradient-wood italic">{t.orders.cart.pageAccent}</span>
        </h1>
        <p className="text-sm text-muted">{t.orders.cart.inOrder(count)}</p>
      </div>
      <KolamBorder className="mt-5 h-4 w-full max-w-md text-honey/70" loops={16} />
      <MinOrderNote className="mt-6 max-w-2xl" />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
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
              {t.orders.cart.summary}
            </h2>
            <TotalsList totals={totals} className="mt-5" />
            <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
              {t.orders.cart.proceed}
            </ButtonLink>
            <ul className="mt-4 space-y-2 text-xs text-muted">
              {t.orders.cart.notes.map((note, i) => {
                const Icon = NOTE_ICONS[i] ?? Truck;
                return (
                  <li key={note} className="flex items-start gap-2">
                    <Icon size={14} className="mt-px shrink-0 text-leaf" aria-hidden="true" /> {note}
                  </li>
                );
              })}
            </ul>
          </div>
          <Suggestions exclude={inCart} layout="list" limit={3} />
        </aside>
      </div>
    </div>
  );
}
