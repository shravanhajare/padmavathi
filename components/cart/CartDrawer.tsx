'use client';

import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import { useCartStore, resolveLines } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { scrollToTarget } from '@/lib/scroll';
import { CloseButton, Modal } from '@/components/ui/Modal';
import { buttonClasses } from '@/components/ui/Button';
import { EmptySpoon, FreeDeliveryMeter, LineItem, Suggestions, TotalsList, useCartTotals } from './CartBits';
import { formatINR, pluralize } from '@/lib/utils';

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen);
  const close = useUIStore((s) => s.closeCart);
  const rawLines = useCartStore((s) => s.lines);
  const lines = useMemo(() => resolveLines(rawLines), [rawLines]);
  const totals = useCartTotals(lines);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const inCart = useMemo(() => new Set(lines.map((l) => l.productId)), [lines]);

  return (
    <Modal open={open} onClose={close} labelledBy="cart-title" variant="drawer">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 id="cart-title" className="text-2xl font-semibold text-fg">
            Your cart
          </h2>
          <p className="text-sm text-muted" aria-live="polite">
            {count === 0 ? 'Nothing here yet' : pluralize(count, 'piece')}
          </p>
        </div>
        <CloseButton onClick={close} label="Close cart" />
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <EmptySpoon />
          <p className="font-display text-2xl text-fg">Your cart is empty</p>
          <p className="max-w-xs text-muted">A kitchen without a good wooden spoon? Let’s fix that.</p>
          <button
            type="button"
            className={buttonClasses('primary', 'lg', 'mt-2')}
            onClick={() => {
              close();
              window.setTimeout(() => scrollToTarget('#shop'), 250);
            }}
          >
            Browse the collection <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <div className="px-6 pt-4">
            <FreeDeliveryMeter totals={totals} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6" data-lenis-prevent>
            <ul>
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <LineItem key={l.key} line={l} />
                ))}
              </AnimatePresence>
            </ul>
            <div className="pb-5 pt-2">
              <Suggestions exclude={inCart} />
            </div>
          </div>
          <div className="border-t border-line bg-surface px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <TotalsList totals={totals} />
            <Link href="/checkout" onClick={close} className={buttonClasses('primary', 'lg', 'mt-4 w-full')}>
              <Lock size={17} aria-hidden="true" /> Checkout · {formatINR(totals.total)}
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              <ShoppingCart size={14} aria-hidden="true" /> View full cart
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}
