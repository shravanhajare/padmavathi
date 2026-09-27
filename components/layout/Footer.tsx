'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUp, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { CATEGORIES, type Category } from '@/data/categories';
import { navLinks } from '@/data/site';
import { useBusiness } from '@/components/layout/AppData';
import { LogoMark } from '@/components/ui/Logo';
import { Kolam, KolamBorder, WoodShaving } from '@/components/ui/Kolam';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YoutubeIcon } from '@/components/ui/icons';
import { scrollToTarget } from '@/lib/scroll';
import { selectShopCategory } from '@/lib/events';
import { useCatalog } from './AppData';
import { useT } from '@/i18n/client';

export function Footer() {
  const t = useT();
  const biz = useBusiness();
  const f = t.common.footer;
  const { products } = useCatalog();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  const goCategory = (id: Category['id']) => {
    if (!isHome) {
      router.push('/#shop');
      window.setTimeout(() => selectShopCategory(id), 600);
      return;
    }
    selectShopCategory(id);
    scrollToTarget('#shop');
  };

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-line bg-bg-2" aria-labelledby="footer-title">
      {/* plank edge */}
      <div className="wood-grain relative h-3 bg-[linear-gradient(180deg,#c68642,#a0522d)] opacity-90 dark:opacity-60" aria-hidden="true" />
      <Kolam className="absolute -right-40 top-10 h-[34rem] w-[34rem] text-honey/15" spin draw={false} />
      <WoodShaving className="absolute left-[6%] top-16 h-12 w-14 animate-sway opacity-70" />
      <WoodShaving className="absolute right-[30%] top-24 h-10 w-12 animate-sway opacity-60 [animation-delay:-3s]" variant={1} />

      <div className="container-page relative pb-10 pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-14 w-14" />
              <div>
                <p id="footer-title" className="font-display text-2xl font-bold text-fg">
                  {t.common.brand.name}
                </p>
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted">{t.common.brand.tagline}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              {f.blurb}
            </p>
            <div className="mt-6 flex gap-2.5">
              {[
                { href: biz.socials.instagram, label: 'Instagram', Icon: InstagramIcon },
                { href: biz.socials.facebook, label: 'Facebook', Icon: FacebookIcon },
                { href: biz.socials.youtube, label: 'YouTube', Icon: YoutubeIcon },
                { href: biz.waLink(t.common.whatsappHello), label: 'WhatsApp', Icon: WhatsAppIcon },
              ].map(({ href, label, Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={f.on(label)}
                  whileHover={{ y: -3, rotate: -6 }}
                  whileTap={{ scale: 0.92 }}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-fg transition-colors hover:border-honey hover:text-accent"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          <nav aria-label={f.categories}>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-wood">{f.shop}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CATEGORIES.filter((c) => c.id !== 'all' && products.some((p) => p.category === c.id)).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => goCategory(c.id)} className="group inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
                    <span className="h-px w-0 bg-honey transition-all duration-300 group-hover:w-3" aria-hidden="true" />
                    {t.catalog.categories[c.id]}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={f.footer}>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-wood">{f.explore}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navLinks.map((l) => (
                <li key={l.id}>
                  <Link href={`/#${l.id}`} className="group inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
                    <span className="h-px w-0 bg-honey transition-all duration-300 group-hover:w-3" aria-hidden="true" />
                    {t.common.nav[l.key]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#care" className="group inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
                  <span className="h-px w-0 bg-honey transition-all duration-300 group-hover:w-3" aria-hidden="true" />
                  {t.common.nav.care}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="group inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
                  <span className="h-px w-0 bg-honey transition-all duration-300 group-hover:w-3" aria-hidden="true" />
                  {t.common.nav.cart}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-wood">{f.visit}</h2>
            <ul className="mt-4 space-y-3.5 text-sm text-muted">
              <li className="flex gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <address className="not-italic">{biz.fullAddress}</address>
              </li>
              <li className="flex gap-3">
                <Phone size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <a href={`tel:${biz.tel}`} className="hover:text-fg">
                  {biz.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <a href={`mailto:${biz.email}`} className="break-all hover:text-fg">
                  {biz.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  {t.sections.contact.hours.map((h) => (
                    <span key={h.days} className="block">
                      {h.days}: {h.time}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <KolamBorder className="mt-14 h-5 w-full text-honey/60" loops={40} />

        {/* giant outlined wordmark */}
        <p
          aria-hidden="true"
          className="pointer-events-none mt-6 select-none text-center font-display text-[17vw] font-bold leading-[0.85] tracking-[-0.03em] text-transparent [-webkit-text-stroke:1px_var(--border-strong)] lg:text-[12.5rem]"
        >
          Padmavathi
        </p>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {t.common.brand.name}. {f.madeBy}
          </p>
          <button
            type="button"
            onClick={() => scrollToTarget(0, { duration: 2 })}
            className="group inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 font-semibold text-fg transition-colors hover:border-honey"
          >
            {f.backToTop} <ArrowUp size={14} className="transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
