'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { resolveLines, useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { formatINR, pluralize } from '@/lib/utils';

/** True once the home hero has scrolled past; the hero has its own Shop Now button at the bottom. */
function usePastHero(onHome: boolean) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    if (!onHome) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const hero = document.getElementById('top');
      setPast(!hero || hero.getBoundingClientRect().bottom < window.innerHeight * 0.9);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [onHome]);
  return !onHome || past;
}

/** Phone-only bar pinned to the bottom of the screen whenever the cart has something in it. */
export function MobileCartBar() {
  const pathname = usePathname();
  const rawLines = useCartStore((s) => s.lines);
  const lines = useMemo(() => resolveLines(rawLines), [rawLines]);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const amount = formatINR(lines.reduce((n, l) => n + l.lineTotal, 0));
  const cartOpen = useUIStore((s) => s.cartOpen);
  const quickView = useUIStore((s) => s.quickViewId);
  const openCart = useUIStore((s) => s.openCart);
  const setVisible = useUIStore((s) => s.setCartBarVisible);
  const pastHero = usePastHero(pathname === '/');
  const hiddenRoute = pathname.startsWith('/checkout') || pathname.startsWith('/order') || pathname.startsWith('/studio') || pathname.startsWith('/cart');
  const show = count > 0 && pastHero && !hiddenRoute && !cartOpen && !quickView;

  useEffect(() => {
    setVisible(show);
  }, [show, setVisible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
          initial={{ y: '130%' }}
          animate={{ y: 0 }}
          exit={{ y: '130%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        >
          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart: ${pluralize(count, 'piece')}, ${amount}`}
            className="flex h-[3.75rem] w-full items-center gap-3 btn-wood btn-wood-teak rounded-2xl pl-2 pr-4 text-left active:scale-[0.98]"
          >
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff1d6]/15 ring-1 ring-inset ring-[#fff1d6]/25">
              <ShoppingCart size={20} aria-hidden="true" />
              <motion.span
                key={count}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[linear-gradient(135deg,#fde68a,#facc15)] px-1 text-[0.68rem] font-bold text-[#5c3a21]"
                aria-hidden="true"
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#fff4e2]/75">Your cart</span>
              <span className="block truncate text-[0.95rem] font-semibold tabular-nums">{pluralize(count, 'piece')} · {amount}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
              View cart <ArrowRight size={16} aria-hidden="true" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
