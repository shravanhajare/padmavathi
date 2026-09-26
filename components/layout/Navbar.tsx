'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu as MenuIcon, ShoppingCart, X } from 'lucide-react';
import { useEffect, useState, type MouseEvent } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Kolam } from '@/components/ui/Kolam';
import { ThemeToggle } from './ThemeToggle';
import { navLinks, site, whatsappLink } from '@/data/site';
import { scrollToTarget, lockScroll, unlockScroll } from '@/lib/scroll';
import { selectCount, useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/ui/icons';

function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string>('top');
  useEffect(() => {
    if (!enabled) return;
    const els = navLinks.map((l) => document.getElementById(l.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);
  return active;
}

function CartButton() {
  const count = useCartStore(selectCount);
  const openCart = useUIStore((s) => s.openCart);
  const bump = useUIStore((s) => s.cartBump);
  return (
    <motion.button
      id="cart-button"
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      key={`cart-${bump}`}
      initial={false}
      animate={bump ? { scale: [1, 1.14, 0.94, 1.05, 1] } : undefined}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative flex h-10 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#fcc2e0,#f78fc6_55%,#ee6aad)] pl-3 pr-3.5 text-[0.9rem] font-semibold text-[#3b1a0e] shadow-[inset_0_0_0_2px_#d9a44e,0_8px_22px_-8px_rgb(236_72_153/0.7)] transition-[filter,box-shadow] hover:brightness-105 hover:shadow-[inset_0_0_0_2px_#e8b865,0_0_0_4px_rgb(249_168_212/0.35),0_10px_26px_-8px_rgb(236_72_153/0.8)] sm:pl-3.5 sm:pr-4"
    >
      <motion.span
        key={bump}
        initial={false}
        animate={bump ? { rotate: [0, -16, 12, -6, 0], y: [0, -3, 0, -1, 0] } : undefined}
        transition={{ duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
        className="grid place-items-center"
      >
        <ShoppingCart size={18} strokeWidth={2.3} aria-hidden="true" />
      </motion.span>
      <span className="hidden sm:inline">Cart</span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.3, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
            className="absolute -right-1.5 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[linear-gradient(135deg,#fde68a,#facc15)] px-1 text-[0.68rem] font-bold text-[#5c3a21] shadow-[0_2px_6px_rgb(212_154_6/0.5)] ring-2 ring-surface"
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(isHome);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const onNav = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    setMenuOpen(false);
    if (!isHome) return; // let Next navigate to /#id
    e.preventDefault();
    scrollToTarget(id === 'top' ? 0 : `#${id}`);
    history.replaceState(null, '', id === 'top' ? '/' : `/#${id}`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className={cn('transition-[padding] duration-500 ease-out', scrolled ? 'py-2' : 'py-3 sm:py-4')}>
          <nav
            aria-label="Primary"
            className={cn(
              'mx-auto flex max-w-[1280px] items-center justify-between gap-4 border px-4 transition-all duration-500 ease-out sm:px-6',
              scrolled
                ? 'glass mx-3 h-14 rounded-full border-line shadow-soft sm:mx-4 xl:mx-auto'
                : 'h-16 rounded-none border-transparent sm:h-[4.5rem]',
            )}
          >
            <Link href="/" onClick={(e) => onNav(e, 'top')} aria-label={`${site.name}, home`} className="shrink-0 rounded-lg">
              <Logo compact={scrolled} />
            </Link>

            <ul className="hidden items-center gap-1 lg:flex">
              {navLinks.map((l) => {
                const isActive = isHome && active === l.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={l.id === 'top' ? '/' : `/#${l.id}`}
                      onClick={(e) => onNav(e, l.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'relative rounded-full px-4 py-2 text-[0.93rem] font-medium transition-colors',
                        isActive ? 'text-fg' : 'text-muted hover:text-fg',
                      )}
                    >
                      {l.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-4 -bottom-0.5 h-[2px] rounded-full bg-[linear-gradient(90deg,#ec4899,#c68642)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <CartButton />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface/70 text-fg lg:hidden"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen(true)}
              >
                <MenuIcon size={20} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-bg/95 backdrop-blur-xl lg:hidden"
            initial={{ clipPath: 'circle(0% at 92% 4%)' }}
            animate={{ clipPath: 'circle(150% at 92% 4%)' }}
            exit={{ clipPath: 'circle(0% at 92% 4%)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Kolam className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] text-honey/25" spin />
            <div className="flex h-16 items-center justify-between px-4">
              <Logo compact />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-line-strong"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                autoFocus
              >
                <X size={20} />
              </button>
            </div>
            <ul className="relative flex flex-1 flex-col justify-center gap-1 px-8">
              {navLinks.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={l.id === 'top' ? '/' : `/#${l.id}`}
                    onClick={(e) => onNav(e, l.id)}
                    className="group flex items-baseline gap-4 py-2 font-display text-[2.6rem] font-semibold leading-tight text-fg"
                  >
                    <span className="font-sans text-sm font-medium text-honey">0{i + 1}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-2">{l.label}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="relative flex flex-col items-start gap-4 px-8 pb-10">
              <Link href="/cart" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
                View full cart
              </Link>
              <a
                href={whatsappLink(`Hello ${site.shortName}! I'd like to know more about your wooden kitchenware.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-leaf"
              >
                <WhatsAppIcon size={18} /> Order on WhatsApp · {site.contact.phone}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
