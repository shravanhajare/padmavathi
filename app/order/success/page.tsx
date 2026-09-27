import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SuccessView } from '@/components/checkout/SuccessView';
import { getLocale, getT } from '@/i18n/server';
import { requireUser } from '@/lib/server/auth';
import { getOrderByNumber, orderMessage, toOrderView } from '@/lib/server/orders';
import { getSettings } from '@/lib/server/settings';
import { waLink } from '@/lib/server/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.orders.success.metaTitle, robots: { index: false, follow: false } };
}

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { n } = await searchParams;
  const user = await requireUser(`/order/success?n=${n ?? ''}`);
  const number = Number(n);
  const order = Number.isInteger(number) ? await getOrderByNumber(number) : null;
  if (!order || (order.user_id !== user.id && user.role !== 'admin')) notFound();
  const [view, settings] = await Promise.all([toOrderView(order, await getLocale()), getSettings()]);
  return <SuccessView order={view} waUrl={waLink(settings.whatsappOrderNumber, orderMessage(order))} />;
}
