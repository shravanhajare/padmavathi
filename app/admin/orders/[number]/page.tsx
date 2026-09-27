import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Phone } from 'lucide-react';
import { OrderEditor } from '@/components/admin/OrderEditor';
import { StatusPill } from '@/components/checkout/SuccessView';
import { WhatsAppIcon } from '@/components/ui/icons';
import { LOCALE_META } from '@/i18n/config';
import { getLocale, getT } from '@/i18n/server';
import { requireAdmin } from '@/lib/server/auth';
import { sql } from '@/lib/server/db';
import { getOrderByNumber } from '@/lib/server/orders';
import { waLink } from '@/lib/server/whatsapp';
import { formatPhone } from '@/lib/phone';
import { PRICING } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-fg">{children}</dd>
    </div>
  );
}

export default async function AdminOrder({ params }: { params: Promise<{ number: string }> }) {
  await requireAdmin();
  const { number } = await params;
  const order = /^\d+$/.test(number) ? await getOrderByNumber(Number(number)) : null;
  if (!order) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const o = t.admin.orders;
  const c = order.customer;
  const a = order.address;
  const [account] = order.user_id ? await sql<{ name: string; phone: string }>('select name, phone from public.users where id = $1', [order.user_id]) : [];
  const greet = `Namaste ${c.name}! This is Padmavathi Enterprises about your order #${order.number}.`;
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" /> {o.back}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-fg sm:text-4xl">#{order.number}</h1>
        <StatusPill status={order.status} />
        <span className="text-sm text-muted">{new Date(order.created_at).toLocaleString(LOCALE_META[locale].intl, { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-[1.6rem] border border-line bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold text-fg">{o.items}</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((l) => (
                <li key={`${l.productId}:${l.variantId}`} className="flex items-center gap-3 py-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <Image src={l.image} alt="" fill sizes="56px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">{l.name}</span>
                    <span className="block text-xs text-muted">{l.variantLabel}</span>
                  </span>
                  <span className="text-right text-sm">
                    <span className="block font-display text-lg font-semibold tabular-nums text-fg">× {l.qty}</span>
                    <span className="block text-xs text-muted">
                      {formatINR(l.price)} → {formatINR(l.lineTotal)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between text-muted">
                <dt>{t.orders.cart.subtotal}</dt>
                <dd className="tabular-nums text-fg">{formatINR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>{t.orders.cart.gst(Math.round(PRICING.gstRate * 100))}</dt>
                <dd className="tabular-nums text-fg">{formatINR(order.tax)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold text-fg">
                <dt>{t.orders.cart.total}</dt>
                <dd className="tabular-nums">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-[1.6rem] border border-line bg-card p-5 shadow-soft sm:p-6">
            <OrderEditor number={order.number} status={order.status} notes={order.admin_notes ?? ''} />
          </section>
        </div>

        <section className="rounded-[1.6rem] border border-line bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold text-fg">{o.customer}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={waLink(`91${c.phone}`, greet)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white">
              <WhatsAppIcon size={16} /> {o.whatsappCustomer}
            </a>
            <a href={`tel:+91${c.phone}`} className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2.5 text-sm font-semibold text-fg">
              <Phone size={15} aria-hidden="true" /> {o.call}
            </a>
          </div>
          <dl className="mt-4 divide-y divide-line">
            <Row label={o.customer}>{c.name}</Row>
            <Row label={o.contact}>
              {formatPhone(c.phone)}
              {c.email && <span className="block text-muted">{c.email}</span>}
            </Row>
            {c.business && <Row label={o.business}>{c.business}</Row>}
            {c.gstin && <Row label={o.gstin}>{c.gstin}</Row>}
            <Row label={o.fulfilment}>{order.fulfilment === 'pickup' ? o.pickup : o.ship}</Row>
            {a && <Row label={o.address}>{[a.address, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</Row>}
            {order.notes && (
              <Row label={o.notes}>
                <span className="whitespace-pre-line">{order.notes}</span>
              </Row>
            )}
            {account && (
              <Row label={o.placedBy}>
                {account.name} · {formatPhone(account.phone)}
              </Row>
            )}
            <Row label={o.lang}>{LOCALE_META[order.lang]?.label ?? order.lang}</Row>
            <Row label="WhatsApp">{order.whatsapp_notified ? o.waNotified : o.waNotNotified}</Row>
          </dl>
        </section>
      </div>
    </div>
  );
}
