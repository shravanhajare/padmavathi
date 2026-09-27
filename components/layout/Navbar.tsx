'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogIn, LogOut, Menu as MenuIcon, Settings as SettingsIcon, ShoppingCart, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Kolam } from '@/components/ui/Kolam';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSegments } from './LanguageSwitcher';
import { AddressPill } from './AddressPill';
import { useBusiness, useSessionUser } from './AppData';
import { navLinks } from '@/data/site';
import { logoutAction } from '@/app/actions/auth';
import { useT } from '@/i18n/client';
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
  const t = useT();
  const count = useCartStore(selectCount);
  const openCart = useUIStore((s) => s.openCart);
  const bump = useUIStore((s) => s.cartBump);
  return (
    <motion.button
      id="cart-button"
      type="button"
      onClick={openCart}
      aria-label={t.orders.cart.open(count)}
      key={`cart-${bump}`}
      initial={false}
      animate={bump ? { scale: [1, 1.14, 0.94, 1.05, 1] } : undefined}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative grid h-10 w-10 shrink-0 place-items-center btn-wood btn-wood-teak rounded-full"
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
            {count > 999 ? '999+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Log in, or — once signed in — the avatar opens Profile / Settings / Log out. */
function AccountButton() {
  const t = useT();
  const user = useSessionUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label={t.common.account.login}
        title={t.common.account.login}
        className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface/70 text-fg transition-colors hover:border-honey"
      >
        <UserRound size={18} aria-hidden="true" />
      </Link>
    );
  }

  const items =
    user.role === 'admin'
      ? [
          { href: '/admin', label: t.common.account.admin, Icon: LayoutDashboard },
          { href: '/account#profile', label: t.orders.account.profile, Icon: UserRound },
          { href: '/account#settings', label: t.common.account.settings, Icon: SettingsIcon },
        ]
      : [
          { href: '/account#profile', label: t.orders.account.profile, Icon: UserRound },
          { href: '/account#settings', label: t.common.account.settings, Icon: SettingsIcon },
        ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.common.account.myAccount}
        title={t.common.account.myAccount}
        className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface/70 text-fg transition-colors hover:border-honey"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] font-display text-sm font-bold text-[#3a1f0c]">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-50 w-52 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
          >
            {items.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-fg hover:bg-surface-2"
              >
                <Icon size={16} className="text-muted" aria-hidden="true" /> {label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logoutAction();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-fg hover:bg-surface-2"
            >
              <LogOut size={16} className="text-muted" aria-hidden="true" /> {t.common.account.logout}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const t = useT();
  const biz = useBusiness();
  const user = useSessionUser();
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
            aria-label={t.common.nav.primary}
            className={cn(
              'mx-auto flex max-w-[1280px] items-center justify-between gap-4 border px-4 transition-all duration-500 ease-out sm:px-6',
              scrolled
                ? 'glass mx-3 h-14 rounded-full border-line shadow-soft sm:mx-4 xl:mx-auto'
                : 'h-16 rounded-none border-transparent sm:h-[4.5rem]',
            )}
          >
            <Link href="/" onClick={(e) => onNav(e, 'top')} aria-label={t.common.nav.homeLabel} className="shrink-0 rounded-lg">
              <Logo compact={scrolled} />
            </Link>

            <ul className="hidden items-center gap-1 lg:flex">
              {navLinks.map((l) => {
                const isActive = isHome && active === l.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/#${l.id}`}
                      onClick={(e) => onNav(e, l.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'relative rounded-full px-4 py-2 text-[0.93rem] font-medium transition-colors',
                        isActive ? 'text-fg' : 'text-muted hover:text-fg',
                      )}
                    >
                      {t.common.nav[l.key]}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-4 -bottom-0.5 h-[2px] rounded-full bg-[linear-gradient(90deg,#3f7a5a,#c68642)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <AddressPill className="hidden md:flex" />
              <div className="hidden sm:block">
                <AccountButton />
              </div>
              <CartButton />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface/70 text-fg lg:hidden"
                aria-label={t.common.nav.openMenu}
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
            aria-label={t.common.nav.menu}
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
                aria-label={t.common.nav.closeMenu}
                onClick={() => setMenuOpen(false)}
                autoFocus
              >
                <X size={20} />
              </button>
            </div>
            <ul className="relative flex flex-1 flex-col justify-center gap-0.5 px-8">
              {navLinks.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/#${l.id}`}
                    onClick={(e) => onNav(e, l.id)}
                    className="group flex items-baseline gap-4 py-1.5 font-display text-[2.3rem] font-semibold leading-tight text-fg"
                  >
                    <span className="font-sans text-sm font-medium text-honey">0{i + 1}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-2">{t.common.nav[l.key]}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <div className="grid grid-cols-2 gap-2">
                {user ? (
                  <>
                    <Link
                      href={user.role === 'admin' ? '/admin' : '/account'}
                      onClick={() => setMenuOpen(false)}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl btn-wood btn-wood-teak text-sm font-semibold"
                    >
                      {user.role === 'admin' ? <LayoutDashboard size={17} aria-hidden="true" /> : <UserRound size={17} aria-hidden="true" />}
                      {user.role === 'admin' ? t.common.account.admin : t.common.account.myAccount}
                    </Link>
                    <button
                      type="button"
                      onClick={() => logoutAction()}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-surface/70 text-sm font-semibold text-fg"
                    >
                      <LogOut size={17} aria-hidden="true" /> {t.common.account.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl btn-wood btn-wood-teak text-sm font-semibold"
                    >
                      <LogIn size={17} aria-hidden="true" /> {t.common.account.login}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-surface/70 text-sm font-semibold text-fg"
                    >
                      {t.common.account.register}
                    </Link>
                  </>
                )}
              </div>
              <AddressPill className="w-full max-w-none justify-start md:hidden [&>button]:w-full [&>button]:max-w-none" />
              <div className="flex items-center gap-2">
                <LanguageSegments className="flex-1" />
                <ThemeToggle className="shrink-0" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <Link href="/cart" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
                  {t.common.nav.viewFullCart}
                </Link>
                <a
                  href={biz.waLink(t.common.whatsappHello)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-leaf"
                >
                  <WhatsAppIcon size={18} /> {biz.phone}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
