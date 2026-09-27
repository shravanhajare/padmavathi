import Link from 'next/link';
import { IndianRupee, MessageSquare, PackageOpen, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { OrderList } from '@/components/admin/OrderList';
import { LOCALE_META } from '@/i18n/config';
import { getLocale, getT } from '@/i18n/server';
import { dashboardStats, listOrders } from '@/lib/server/admin';
import { requireAdmin } from '@/lib/server/auth';
import { formatINR } from '@/lib/utils';

export default async function AdminDashboard() {
  await requireAdmin();
  const [t, locale, stats, recent] = await Promise.all([getT(), getLocale(), dashboardStats(), listOrders({ limit: 8 })]);
  const d = t.admin.dashboard;
  const cards = [
    { label: d.newOrders, value: stats.newOrders, Icon: Sparkles, href: '/admin/orders?status=new', tone: 'from-[#fde68a] to-[#facc15]' },
    { label: d.openOrders, value: stats.openOrders, Icon: PackageOpen, href: '/admin/orders', tone: 'from-[#f6d9a6] to-[#e2a867]' },
    { label: d.monthOrders, value: stats.monthOrders, Icon: ShoppingBag, href: '/admin/orders', tone: 'from-[#d7e8d0] to-[#9fc3a8]' },
    { label: d.monthValue, value: formatINR(stats.monthValue), Icon: IndianRupee, href: '/admin/orders', tone: 'from-[#e9d5b8] to-[#c68642]' },
    { label: d.customers, value: stats.customers, Icon: Users, href: '/admin/customers', tone: 'from-[#dbe7f5] to-[#9bb8d8]' },
    { label: d.newEnquiries, value: stats.newEnquiries, Icon: MessageSquare, href: '/admin/enquiries', tone: 'from-[#f3d9e3] to-[#d9a0b5]' },
  ];
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{d.title}</h1>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, Icon, href, tone }) => (
          <li key={label}>
            <Link href={href} className="flex h-full flex-col gap-3 rounded-[1.4rem] border border-line bg-card p-4 shadow-soft transition-transform hover:-translate-y-1 sm:p-5">
              <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-[#3a1f0c]`}>
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="font-display text-2xl font-semibold tabular-nums text-fg sm:text-3xl">{value}</span>
              <span className="text-xs font-medium leading-snug text-muted">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-fg">{d.recent}</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-accent hover:underline">
            {d.viewAll}
          </Link>
        </div>
        <OrderList orders={recent} t={t} intl={LOCALE_META[locale].intl} />
      </section>
    </div>
  );
}
