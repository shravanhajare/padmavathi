import type { Metadata } from 'next';
import { CheckoutView } from '@/components/checkout/CheckoutView';
import { getT } from '@/i18n/server';
import { requireUser } from '@/lib/server/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.orders.checkout.metaTitle, robots: { index: false, follow: false } };
}

export default async function CheckoutPage() {
  // bulk orders are placed from an account, so the order history and contact details are real
  await requireUser('/checkout');
  return <CheckoutView />;
}
