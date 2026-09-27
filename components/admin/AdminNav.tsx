'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageSquare, Package, Settings, ShoppingBag, Star, Users } from 'lucide-react';
import { useT } from '@/i18n/client';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/admin/orders', key: 'orders', Icon: ShoppingBag },
  { href: '/admin/products', key: 'products', Icon: Package },
  { href: '/admin/customers', key: 'customers', Icon: Users },
  { href: '/admin/enquiries', key: 'enquiries', Icon: MessageSquare },
  { href: '/admin/reviews', key: 'reviews', Icon: Star },
  { href: '/admin/settings', key: 'settings', Icon: Settings },
] as const;

export function AdminNav({ badges }: { badges: { orders: number; enquiries: number } }) {
  const t = useT();
  const path = usePathname();
  return (
    <nav aria-label={t.admin.title} className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {LINKS.map(({ href, key, Icon }) => {
        const active = href === '/admin' ? path === href : path.startsWith(href);
        const badge = key === 'orders' ? badges.orders : key === 'enquiries' ? badges.enquiries : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn('relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors', active ? 'text-[#3a1f0c]' : 'text-muted hover:text-fg')}
          >
            {active && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <Icon size={16} className="relative" aria-hidden="true" />
            <span className="relative">{t.admin.nav[key]}</span>
            {badge > 0 && <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-[#2c5a42] px-1 text-[0.68rem] font-bold text-white">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
