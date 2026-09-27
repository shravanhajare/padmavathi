import 'server-only';
import { products as codeProducts } from '@/data/products';
import type { Product } from '@/data/types';
import type { ProductI18n } from '@/i18n/config';
import { productTranslations } from '@/i18n/products';
import type { CatalogEntry } from '@/lib/catalog';
import { hasDatabase, sql } from './db';

/**
 * The catalogue lives in public.products (seeded from data/products.ts, edited in
 * /admin). Cached briefly per server instance; admin edits clear it here and
 * other instances pick changes up within TTL. If the database is unreachable
 * the shop keeps working from the code catalogue.
 */
const TTL = 30_000;
let cached: { at: number; entries: CatalogEntry[] } | null = null;

const fromCode = (): CatalogEntry[] =>
  codeProducts.map((p) => ({ product: p, i18n: productTranslations[p.id] ?? {}, active: true }));

export async function getCatalog(opts: { includeInactive?: boolean } = {}): Promise<CatalogEntry[]> {
  let entries: CatalogEntry[];
  if (cached && Date.now() - cached.at < TTL) entries = cached.entries;
  else if (!hasDatabase()) entries = fromCode();
  else {
    try {
      const rows = await sql<{ data: Product; i18n: ProductI18n; active: boolean }>(
        'select data, i18n, active from public.products order by sort_order, id',
      );
      entries = rows.length ? rows.map((r) => ({ product: r.data, i18n: r.i18n ?? {}, active: r.active })) : fromCode();
      cached = { at: Date.now(), entries };
    } catch (err) {
      console.error('[catalog] database unavailable, serving the code catalogue', err);
      entries = fromCode();
    }
  }
  return opts.includeInactive ? entries : entries.filter((e) => e.active);
}

export async function getCatalogEntry(id: string) {
  return (await getCatalog({ includeInactive: true })).find((e) => e.product.id === id) ?? null;
}

export function invalidateCatalog() {
  cached = null;
}
