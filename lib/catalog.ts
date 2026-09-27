import type { Product } from '@/data/types';
import type { Locale, ProductI18n } from '@/i18n/config';

/** A catalogue row as the server sends it: English product + its translations. */
export interface CatalogEntry {
  product: Product;
  i18n: ProductI18n;
  active: boolean;
}

/** The product in the visitor's language; untranslated fields stay English. */
export function localizeProduct(p: Product, i18n: ProductI18n | undefined, locale: Locale): Product {
  const t = locale === 'en' ? undefined : i18n?.[locale];
  if (!t) return p;
  return {
    ...p,
    name: t.name || p.name,
    localName: t.localName || p.localName,
    description: t.description || p.description,
    story: t.story || p.story,
    finish: t.finish || p.finish,
    includes: t.includes?.length ? t.includes : p.includes,
    variants: p.variants.map((v) => ({ ...v, label: t.variants?.[v.id] || v.label })),
  };
}

export const lowestPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
