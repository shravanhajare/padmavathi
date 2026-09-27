import { ReviewsManager } from '@/components/admin/ReviewsManager';
import { getT } from '@/i18n/server';
import { requireAdmin } from '@/lib/server/auth';
import { getReviews } from '@/lib/server/reviews';

export default async function AdminReviews() {
  await requireAdmin();
  const [t, reviews] = await Promise.all([getT(), getReviews({ includeHidden: true })]);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{t.admin.reviews.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.admin.reviews.intro}</p>
      </div>
      <ReviewsManager reviews={reviews} />
    </div>
  );
}
