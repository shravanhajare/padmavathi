'use client';

import { useMemo } from 'react';
import { computeTotals } from '@/lib/pricing';
import { resolveLines, useCartStore } from '@/store/cart';
import { useCatalog } from '@/components/layout/AppData';

/** The cart joined with the live, localized catalogue, plus totals. */
export function useCart() {
  const raw = useCartStore((s) => s.lines);
  const { getProduct } = useCatalog();
  return useMemo(() => {
    const lines = resolveLines(raw, getProduct);
    return { lines, totals: computeTotals(lines), count: lines.reduce((n, l) => n + l.qty, 0) };
  }, [raw, getProduct]);
}
