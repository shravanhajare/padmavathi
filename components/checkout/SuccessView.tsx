'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Building2, MapPin, Package, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LAST_ORDER_KEY, type OrderSummary } from '@/lib/orders';
import { fullAddress, site, whatsappLink } from '@/data/site';
import { ButtonLink } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/icons';
import { Kolam } from '@/components/ui/Kolam';
import { TotalsList } from '@/components/cart/CartBits';
import { formatINR } from '@/lib/utils';
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
      <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#ec4899" strokeWidth="2" variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1, transition: { delay: 0.2, duration: 0.8 } } }} />
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

export function SuccessView() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const [order, setOrder] = useState<OrderSummary | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      if (raw) {
        const o = JSON.parse(raw) as OrderSummary;
        if (!ref || o.ref === ref) setOrder(o);
      }
    } catch {
      /* ignore */
    }
  }, [ref]);

  const shareText = order
    ? `Hello ${site.shortName}! I just placed order ${order.ref} (${formatINR(order.totals.total)}).`
    : `Hello ${site.shortName}! I just placed an order on your website.`;
  const FulfilIcon = order?.fulfilment === 'pickup' ? Store : Package;

  return (
    <div className="relative overflow-hidden">
      <ShavingConfetti />
      <Kolam className="absolute left-1/2 top-24 h-[44rem] w-[44rem] -translate-x-1/2 text-honey/20" spin />
      <div className="container-page relative z-10 flex flex-col items-center pb-24 pt-32 text-center">
        <Tick />
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 text-lg font-semibold text-wood">
          Dhanyavaad!
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 max-w-2xl text-4xl font-semibold text-fg sm:text-6xl"
        >
          Your order is confirmed{order ? `, ${order.customer.name.split(' ')[0]}` : ''}.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 max-w-lg text-muted">
          {order
            ? `A confirmation is on its way to ${order.customer.email}. We’ll oil, wrap and pack your pieces and send dispatch updates on WhatsApp.`
            : 'We’ll oil, wrap and pack your pieces and send dispatch updates on WhatsApp.'}
          {order?.mode === 'demo' && ' (This was a demo order: no payment was taken.)'}
          {order?.mode === 'test' && ' (Razorpay test mode: no real payment was taken.)'}
        </motion.p>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 w-full max-w-2xl rounded-[1.75rem] border border-line bg-card p-6 text-left shadow-lift sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
              <p className="text-sm text-muted">
                Order <span className="font-semibold text-fg">{order.ref}</span>
              </p>
              <p className="font-display text-2xl font-semibold text-fg">{formatINR(order.totals.total)}</p>
            </div>
            <ul className="divide-y divide-line">
              {order.lines.map((l) => (
                <li key={`${l.productId}:${l.variantId}`} className="flex items-center gap-3 py-3">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <Image src={l.image} alt="" fill sizes="48px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{l.name}</span>
                    <span className="block text-xs text-muted">
                      {l.qty} × {l.variantLabel}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatINR(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <TotalsList totals={order.totals} className="mt-2 border-t border-line pt-4" />
            <div className="mt-5 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <p className="flex gap-2 text-muted">
                <FulfilIcon size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-fg">{order.fulfilment === 'pickup' ? 'Pickup from the workshop' : 'Delivery across India'}</span>
                  {order.address ?? fullAddress}
                </span>
              </p>
              {order.business ? (
                <p className="flex gap-2 text-muted">
                  <Building2 size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-fg">{order.business.name}</span>
                    {order.business.gstin ? `GSTIN ${order.business.gstin}` : 'Bulk / wholesale order'}
                  </span>
                </p>
              ) : (
                <p className="flex gap-2 text-muted">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-fg">Dispatch within 48 hours</span>
                    Arrives in 3 to 6 days across India
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/#shop" size="lg" magnetic>
            Continue shopping
          </ButtonLink>
          <ButtonLink href={whatsappLink(shareText)} target="_blank" rel="noopener noreferrer" size="lg" variant="outline">
            <WhatsAppIcon size={18} /> Message us on WhatsApp
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
