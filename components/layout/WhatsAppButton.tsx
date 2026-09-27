'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WhatsAppIcon } from '@/components/ui/icons';
import { useBusiness } from '@/components/layout/AppData';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';

/** On phones the button tucks away while scrolling down, so it never sits on top of an Add button. */
function useTuckedOnScroll() {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    const phone = window.matchMedia('(max-width: 767px)');
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (!phone.matches) setTucked(false);
      else if (Math.abs(y - lastY) > 8) setTucked(y > lastY && y > 240);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return tucked;
}

export function WhatsAppButton() {
  const t = useT();
  const biz = useBusiness();
  const tucked = useTuckedOnScroll();
  const barVisible = useUIStore((s) => s.cartBarVisible);
  const quickView = useUIStore((s) => s.quickViewId);
  const pathname = usePathname();
  // on phones it would sit on the quick view's Add bar and on the order totals
  const inTheWay = !!quickView || pathname.startsWith('/cart') || pathname.startsWith('/checkout') || pathname.startsWith('/order') || pathname.startsWith('/admin');
  return (
    <div
      className={cn(
        'fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:right-6',
        barVisible && 'max-md:-translate-y-[4.6rem]',
        (tucked || inTheWay) && 'max-md:pointer-events-none max-md:translate-x-[calc(100%+1.5rem)] max-md:opacity-0',
      )}
    >
      <motion.a
        href={biz.waLink(t.common.whatsappHello)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.sections.contact.chat}
        className="group flex items-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <span className="pointer-events-none mr-3 hidden translate-x-2 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-fg opacity-0 shadow-soft transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
          {t.sections.contact.chat}
        </span>
        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_12px_30px_-8px_rgb(37_211_102/0.7)] sm:h-14 sm:w-14">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366] opacity-25 [animation-duration:2.4s]" aria-hidden="true" />
          <WhatsAppIcon size={26} className="relative" />
        </span>
      </motion.a>
    </div>
  );
}
