import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { OrderDetails } from '@/components/checkout/SuccessView';
import { getLocale, getT } from '@/i18n/server';
import { requireUser } from '@/lib/server/auth';
import { getOrderByNumber, orderMessage, toOrderView } from '@/lib/server/orders';
import { getSettings } from '@/lib/server/settings';
import { waLink } from '@/lib/server/whatsapp';

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const [t, { number }] = await Promise.all([getT(), params]);
  return { title: t.orders.account.order(Number(number)), robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}`);
  const order = /^\d+$/.test(number) ? await getOrderByNumber(Number(number)) : null;
  if (!order || (order.user_id !== user.id && user.role !== 'admin')) notFound();
  const [t, view, settings] = await Promise.all([getT(), toOrderView(order, await getLocale()), getSettings()]);
  return (
    <div className="container-page pb-24 pt-28 sm:pt-32">
      <Link href="/account" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" /> {t.orders.account.orders}
      </Link>
      <div className="mt-6">
        <OrderDetails order={view} waUrl={waLink(settings.whatsappOrderNumber, orderMessage(order))} />
      </div>
    </div>
  );
}
