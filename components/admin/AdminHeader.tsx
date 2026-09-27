import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AdminNav } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LogoMark } from '@/components/ui/Logo';
import { getT } from '@/i18n/server';

/**
 * The admin's own top bar: no shop navbar, cart or WhatsApp button, just the
 * sections an admin needs and a way out (view the live site, or log out).
 */
export async function AdminHeader({ badges }: { badges: { orders: number; enquiries: number } }) {
  const t = await getT();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="hidden font-display text-lg font-semibold text-fg sm:inline">{t.admin.title}</span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <ThemeToggle />
          <Link
            href="/"
            className="hidden h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface/70 px-3.5 text-sm font-semibold text-fg transition-colors hover:border-honey sm:inline-flex"
          >
            {t.admin.nav.viewSite} <ExternalLink size={14} aria-hidden="true" />
          </Link>
          <LogoutButton />
        </div>
      </div>
      <div className="container-page pb-3">
        <AdminNav badges={badges} />
      </div>
    </header>
  );
}
