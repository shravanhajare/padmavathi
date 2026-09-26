'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getProduct } from '@/data/products';

export interface CartLine {
  /** `${productId}:${variantId}` */
  key: string;
  productId: string;
  variantId: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (productId: string, variantId: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  /** Swaps a line to another size of the same product, merging with an existing line. */
  setVariant: (key: string, variantId: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

/** Per line. Bulk buyers can go higher by talking to us. */
export const MAX_QTY = 500;

const clampQty = (q: number) => Math.min(MAX_QTY, Math.max(0, Math.round(q)));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (productId, variantId, qty = 1) =>
        set((s) => {
          const key = `${productId}:${variantId}`;
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: clampQty(l.qty + qty) } : l)) };
          }
          return { lines: [...s.lines, { key, productId, variantId, qty: clampQty(qty) }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: clampQty(qty) } : l)),
        })),
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
                .map((l) => (l.key === nextKey ? { ...l, qty: clampQty(l.qty + line.qty) } : l)),
            };
          }
          return { lines: s.lines.map((l) => (l.key === key ? { ...l, key: nextKey, variantId } : l)) };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'pe-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Drop anything that no longer exists in the catalogue.
      merge: (persisted, current) => {
        const p = persisted as Partial<CartState> | undefined;
        const lines = (p?.lines ?? []).filter((l) => {
          const product = getProduct(l.productId);
          return product && product.variants.some((v) => v.id === l.variantId) && l.qty > 0;
        });
        return { ...current, lines };
      },
    },
  ),
);

export interface ResolvedLine extends CartLine {
  name: string;
  image: string;
  variantLabel: string;
  price: number;
  lineTotal: number;
}

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const l of lines) {
    const product = getProduct(l.productId);
    const variant = product?.variants.find((v) => v.id === l.variantId);
    if (!product || !variant) continue;
    out.push({
      ...l,
      name: product.name,
      image: product.image,
      variantLabel: variant.label,
      price: variant.price,
      lineTotal: variant.price * l.qty,
    });
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
