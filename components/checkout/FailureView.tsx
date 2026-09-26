'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { site, whatsappLink } from '@/data/site';
import { ButtonLink } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/icons';

/** A belan that has rolled to a stop, wobbling: nothing broke, it just didn't go through. */
function StoppedBelan() {
  return (
    <motion.svg viewBox="0 0 200 90" className="h-24 w-56" aria-hidden="true" initial={{ x: -40, rotate: -8, opacity: 0 }} animate={{ x: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 10 }}>
      <defs>
        <linearGradient id="fb-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2a867" />
          <stop offset="0.5" stopColor="#c68642" />
          <stop offset="1" stopColor="#8f4a24" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="80" rx="80" ry="6" fill="rgb(92 58 33 / 0.14)" />
      <rect x="36" y="46" width="128" height="24" rx="12" fill="url(#fb-wood)" />
      <rect x="10" y="52" width="30" height="12" rx="6" fill="#a0522d" />
      <rect x="160" y="52" width="30" height="12" rx="6" fill="#a0522d" />
      <rect x="44" y="50" width="112" height="4" rx="2" fill="#fff3dc" opacity="0.45" />
      <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: [0, 1, 1, 0], y: [6, -4, -10, -16] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.8 }}>
        <text x="100" y="30" textAnchor="middle" fontSize="22" fill="#3f7a5a" fontFamily="serif">?</text>
      </motion.g>
    </motion.svg>
  );
}

export function FailureView() {
  const params = useSearchParams();
  const reason = params.get('reason');
  const ref = params.get('ref');
  return (
    <div className="container-page flex min-h-[80vh] flex-col items-center justify-center pb-24 pt-32 text-center">
      <StoppedBelan />
      <h1 className="mt-7 text-4xl font-semibold text-fg sm:text-5xl">The payment didn’t go through</h1>
      <p className="mt-4 max-w-lg text-muted">
        {reason ?? 'Your bank or UPI app declined the payment.'} Nothing was charged, and your cart is saved, so you can try again.
      </p>
      {ref && <p className="mt-2 text-xs text-muted">Reference: {ref}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/checkout" size="lg" magnetic>
          <RotateCcw size={18} aria-hidden="true" /> Try again
        </ButtonLink>
        <ButtonLink
          href={whatsappLink(`Hello ${site.shortName}! My payment didn't go through${ref ? ` (${ref})` : ''}. Can you help?`)}
          target="_blank"
          rel="noopener noreferrer"
          size="lg"
          variant="outline"
        >
          <WhatsAppIcon size={18} /> Order on WhatsApp
        </ButtonLink>
      </div>
    </div>
  );
}
