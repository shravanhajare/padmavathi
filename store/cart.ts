'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/data/types';

export interface CartLine {
  /** `${productId}:${variantId}` */
  key: string;
  productId: string;
  variantId: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  /** Bulk minimum per line, from the shop settings (not persisted). */
  minQty: number;
  setMinQty: (n: number) => void;
  /** Adds `qty` (a new line starts at the minimum). */
  add: (productId: string, variantId: string, qty?: number) => void;
  /** Sets a line's quantity, never below the minimum. */
  setQty: (key: string, qty: number) => void;
  /** Swaps a line to another size of the same product, merging with an existing line. */
  setVariant: (key: string, variantId: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

/** Per line. Bigger orders go through an enquiry. */
export const MAX_QTY = 10_000;
/** Stepper increments for bulk quantities. */
export const QTY_STEP = 5;

const clampQty = (q: number, min: number) => Math.min(MAX_QTY, Math.max(min, Math.round(q) || min));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      minQty: 20,
      // persist writes on every set(), so only set when the value really changes
      setMinQty: (n) => {
        if (get().minQty !== n) set((s) => ({ minQty: n, lines: s.lines.map((l) => ({ ...l, qty: clampQty(l.qty, n) })) }));
      },
      add: (productId, variantId, qty) =>
        set((s) => {
          const key = `${productId}:${variantId}`;
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: clampQty(l.qty + (qty ?? QTY_STEP), s.minQty) } : l)) };
          }
          return { lines: [...s.lines, { key, productId, variantId, qty: clampQty(qty ?? s.minQty, s.minQty) }] };
        }),
      setQty: (key, qty) => set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, qty: clampQty(qty, s.minQty) } : l)) })),
      setVariant: (key, variantId) =>
        set((s) => {
          const line = s.lines.find((l) => l.key === key);
          if (!line || line.variantId === variantId) return s;
          const nextKey = `${line.productId}:${variantId}`;
          const target = s.lines.find((l) => l.key === nextKey);
          if (target) {
            return {
              lines: s.lines
                .filter((l) => l.key !== key)
                .map((l) => (l.key === nextKey ? { ...l, qty: clampQty(l.qty + line.qty, s.minQty) } : l)),
            };
          }
          return { lines: s.lines.map((l) => (l.key === key ? { ...l, key: nextKey, variantId } : l)) };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'pe-cart',
      // v2: bulk-only (lines below the minimum are raised to it on load)
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines }),
      migrate: (persisted) => persisted as CartState,
      merge: (persisted, current) => {
        const p = persisted as Partial<CartState> | undefined;
        const lines = (p?.lines ?? []).filter((l) => l.qty > 0).map((l) => ({ ...l, qty: clampQty(l.qty, current.minQty) }));
        return { ...current, lines };
      },
    },
  ),
);

export interface ResolvedLine extends CartLine {
  product: Product;
  name: string;
  image: string;
  variantLabel: string;
  price: number;
  lineTotal: number;
}

/** Joins cart lines with the (localized) catalogue; lines for products no longer on sale drop out. */
export function resolveLines(lines: CartLine[], getProduct: (id: string) => Product | undefined): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const l of lines) {
    const product = getProduct(l.productId);
    const variant = product?.variants.find((v) => v.id === l.variantId);
    if (!product || !variant) continue;
    out.push({ ...l, product, name: product.name, image: product.image, variantLabel: variant.label, price: variant.price, lineTotal: variant.price * l.qty });
  }
  return out;
}

export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.qty, 0);

/** True once the persisted cart has been read from localStorage. */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCartStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
