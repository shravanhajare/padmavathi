import type { ReviewText } from '@/data/testimonials';
import type { Locale } from '@/i18n/config';

export interface Review {
  id: string;
  name: string;
  rating: number;
  /** English is required; Kannada and Hindi fall back to it when blank. */
  i18n: { en: ReviewText; kn?: Partial<ReviewText>; hi?: Partial<ReviewText> };
  active: boolean;
}

export function localizeReview(r: Review, locale: Locale) {
  const tr = locale === 'en' ? undefined : r.i18n[locale];
  const pick = (k: keyof ReviewText) => tr?.[k]?.trim() || r.i18n.en[k];
  return { id: r.id, name: r.name, rating: r.rating, city: pick('city'), product: pick('product'), quote: pick('quote') };
}
