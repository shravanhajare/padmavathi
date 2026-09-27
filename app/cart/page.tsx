import type { Metadata } from 'next';
import { CartPageView } from '@/components/cart/CartPageView';
import { getT } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.orders.cart.title, robots: { index: false, follow: false } };
}

export default function CartPage() {
  return <CartPageView />;
}
