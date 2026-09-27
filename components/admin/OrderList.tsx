import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { StatusPill } from '@/components/checkout/SuccessView';
import type { Messages } from '@/i18n/messages';
import type { OrderRow } from '@/lib/server/orders';
import { formatPhone } from '@/lib/phone';
import { formatINR } from '@/lib/utils';

/** Orders as tappable rows: readable on a phone, scannable on a desktop. */
export function OrderList({ orders, t, intl }: { orders: OrderRow[]; t: Messages; intl: string }) {
  if (!orders.length) return <p className="rounded-[1.5rem] border border-dashed border-line-strong p-8 text-center text-muted">{t.admin.orders.empty}</p>;
  return (
    <ul className="overflow-hidden rounded-[1.5rem] border border-line bg-card shadow-soft">
      {orders.map((o) => {
        const pieces = o.items.reduce((n, l) => n + l.qty, 0);
        return (
          <li key={o.id} className="border-b border-line last:border-b-0">
            <Link href={`/admin/orders/${o.number}`} className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-2/60 sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold text-fg">#{o.number}</span>
                  <StatusPill status={o.status} />
                  <span className="text-xs text-muted">{new Date(o.created_at).toLocaleString(intl, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <p className="mt-1 truncate text-sm text-fg">
                  <span className="font-semibold">{o.customer.name}</span>
                  {o.customer.business && <span className="text-muted"> · {o.customer.business}</span>}
                  <span className="text-muted"> · {formatPhone(o.customer.phone)}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {t.admin.orders.cols.items}: {o.items.map((l) => `${l.name} × ${l.qty}`).join(', ')} ({t.common.pieces(pieces)})
                </p>
              </div>
              <span className="shrink-0 text-right font-semibold tabular-nums text-fg">{formatINR(o.total)}</span>
              <ChevronRight size={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
