'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Package, Store } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/icons';
import { Kolam } from '@/components/ui/Kolam';
import { TotalsList } from '@/components/cart/CartBits';
import { useI18n } from '@/i18n/client';
import { LOCALE_META } from '@/i18n/config';
import type { OrderView } from '@/lib/server/orders';
import { cn, formatINR } from '@/lib/utils';
import { ShavingConfetti } from './ShavingConfetti';

function Tick() {
  return (
    <motion.svg viewBox="0 0 80 80" className="h-24 w-24" initial="hidden" animate="shown" aria-hidden="true">
      <defs>
        <linearGradient id="tick-honey" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d9a6" />
          <stop offset="1" stopColor="#c68642" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="40"
        cy="40"
        r="36"
        fill="url(#tick-honey)"
        variants={{ hidden: { scale: 0 }, shown: { scale: 1, transition: { type: 'spring', stiffness: 260, damping: 16 } } }}
        style={{ originX: '50%', originY: '50%' }}
      />
      <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#3f7a5a" strokeWidth="2" variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1, transition: { delay: 0.2, duration: 0.8 } } }} />
      <motion.path
        d="M24 41 L35 52 L57 29"
        fill="none"
        stroke="#3a1f0c"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1, transition: { delay: 0.35, duration: 0.5, ease: 'easeOut' } } }}
      />
    </motion.svg>
  );
}

export const STATUS_TONE: Record<OrderView['status'], string> = {
  new: 'bg-[#facc15]/20 text-[#8a5a00] dark:text-[#fde68a]',
  confirmed: 'bg-sage/30 text-forest-deep dark:text-[#b9d3b1]',
  in_production: 'bg-honey/20 text-wood',
  dispatched: 'bg-[#3b82f6]/15 text-[#1d4ed8] dark:text-[#93c5fd]',
  delivered: 'bg-leaf/15 text-leaf',
  cancelled: 'bg-[#dc2626]/10 text-[#b91c1c] dark:text-[#fca5a5]',
};

export function StatusPill({ status, className }: { status: OrderView['status']; className?: string }) {
  const { t } = useI18n();
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_TONE[status], className)}>{t.orders.status[status]}</span>;
}

/** The order card used after placing an order and in the account's order history. */
export function OrderDetails({ order, waUrl, fresh = false }: { order: OrderView; waUrl: string; fresh?: boolean }) {
  const { t, locale } = useI18n();
  const s = t.orders.success;
  const date = new Date(order.createdAt).toLocaleString(LOCALE_META[locale].intl, { dateStyle: 'medium', timeStyle: 'short' });
  const a = order.address;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-fg">{t.orders.account.order(order.number)}</h2>
          <StatusPill status={order.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <CalendarDays size={14} aria-hidden="true" /> {s.placedOn}: {date}
        </p>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((l) => (
            <li key={l.key} className="flex items-center gap-3 py-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(circle,#fff6e2,#f6d6b8)] dark:bg-[radial-gradient(circle,#3a2618,#1f140d)]">
                <Image src={l.image} alt="" fill sizes="56px" className="object-contain p-1" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg">{l.name}</span>
                <span className="block text-xs text-muted">
                  {l.variantLabel} · {l.qty} × {formatINR(l.price)}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-fg">{formatINR(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <TotalsList totals={order} fulfilment={order.fulfilment} className="mt-4" />
      </div>
      {/* phones: the WhatsApp step comes first, above the item list */}
      <div className="order-first flex flex-col gap-4 lg:order-none">
        <div className="rounded-[1.75rem] border border-[#25d366]/40 bg-[#25d366]/[0.07] p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-fg">{s.body}</p>
          {order.whatsappNotified && <p className="mt-2 text-xs font-medium text-leaf">{s.notified}</p>}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 font-semibold text-white shadow-[0_14px_30px_-12px_rgb(37_211_102/0.8)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <WhatsAppIcon size={20} /> {fresh ? s.send : s.sendAgain}
          </a>
        </div>
        <div className="rounded-[1.75rem] border border-line bg-card p-5 text-sm shadow-soft sm:p-6">
          <p className="flex items-start gap-2.5 text-muted">
            {order.fulfilment === 'pickup' ? (
              <>
                <Store size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /> {t.orders.checkout.pickup}
              </>
            ) : (
              <>
                <MapPin size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>{[a?.address, a?.landmark, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ')}</span>
              </>
            )}
          </p>
          {order.notes && <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-muted">{order.notes}</p>}
        </div>
        {fresh && (
          <div className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-6">
            <h3 className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-wood">
              <Package size={14} aria-hidden="true" /> {s.nextTitle}
            </h3>
            <ol className="mt-3 space-y-2.5">
              {s.next.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-fg">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] text-xs font-bold text-[#3a1f0c]">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export function SuccessView({ order, waUrl }: { order: OrderView; waUrl: string }) {
  const { t } = useI18n();
  const s = t.orders.success;
  return (
    <div className="relative overflow-hidden">
      <ShavingConfetti />
      <Kolam className="absolute -right-40 top-10 h-[34rem] w-[34rem] text-honey/15" spin />
      <div className="container-page relative pb-24 pt-28 sm:pt-32">
        <div className="flex flex-col items-center text-center">
          <Tick />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.26em] text-wood">{s.badge}</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-fg sm:text-5xl"
          >
            {s.title(order.number)}
          </motion.h1>
        </div>
        <div className="mt-10">
          <OrderDetails order={order} waUrl={waUrl} fresh />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/account" size="lg" variant="outline">
            {s.viewOrders}
          </ButtonLink>
          <ButtonLink href="/#shop" size="lg">
            {s.continue}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
