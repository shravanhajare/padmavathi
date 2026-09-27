import 'server-only';
import { reviewSeeds } from '@/data/testimonials';
import type { Review } from '@/lib/reviews';
import { hasDatabase, sql } from './db';

/** Reviews from the `reviews` table, in display order. Falls back to the seed copy without a database. */
export async function getReviews({ includeHidden = false } = {}): Promise<Review[]> {
  const fallback = () => reviewSeeds.map((r, i) => ({ id: `seed-${i}`, name: r.name, rating: r.rating, i18n: r.i18n, active: true }));
  if (!hasDatabase()) return fallback();
  try {
    return await sql<Review>(
      `select id, name, rating, i18n, active from public.reviews ${includeHidden ? '' : 'where active'} order by sort_order, created_at`,
    );
  } catch (err) {
    console.error('[reviews] falling back to seed copy', err);
    return fallback();
  }
}
