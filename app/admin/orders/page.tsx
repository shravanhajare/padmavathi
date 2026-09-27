import Link from 'next/link';
import { Search } from 'lucide-react';
import { OrderList } from '@/components/admin/OrderList';
import { LOCALE_META } from '@/i18n/config';
import { getLocale, getT } from '@/i18n/server';
import { listOrders } from '@/lib/server/admin';
import { requireAdmin } from '@/lib/server/auth';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/server/orders';
import { cn } from '@/lib/utils';

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const { status: s, q } = await searchParams;
  const status = ORDER_STATUSES.includes(s as OrderStatus) ? (s as OrderStatus) : undefined;
  const [t, locale, orders] = await Promise.all([getT(), getLocale(), listOrders({ status, q, limit: 200 })]);
  const o = t.admin.orders;
  const qs = (st?: string) => {
    const p = new URLSearchParams();
    if (st) p.set('status', st);
    if (q) p.set('q', q);
    const str = p.toString();
    return str ? `/admin/orders?${str}` : '/admin/orders';
  };
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{o.title}</h1>
      <form className="flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="relative flex-1">
          <span className="sr-only">{o.search}</span>
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            placeholder={o.search}
            className="h-12 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-[0.95rem] text-fg outline-none focus:border-forest"
          />
        </label>
        <button type="submit" className="h-12 shrink-0 rounded-full btn-wood btn-wood-teak px-5 text-sm font-semibold">
          {o.searchButton}
        </button>
      </form>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[undefined, ...ORDER_STATUSES].map((st) => (
          <Link
            key={st ?? 'all'}
            href={qs(st)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors',
              st === status ? 'border-transparent bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] text-[#3a1f0c]' : 'border-line-strong text-muted hover:text-fg',
            )}
          >
            {st ? t.orders.status[st] : o.all}
          </Link>
        ))}
      </div>
      <OrderList orders={orders} t={t} intl={LOCALE_META[locale].intl} />
    </div>
  );
}
