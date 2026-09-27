import type { Metadata } from 'next';
import { AccountView } from '@/components/account/AccountView';
import { getLocale, getT } from '@/i18n/server';
import { requireUser } from '@/lib/server/auth';
import { listOrdersForUser, toOrderView } from '@/lib/server/orders';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.orders.account.metaTitle, robots: { index: false, follow: false } };
}

export default async function AccountPage() {
  const user = await requireUser('/account');
  const locale = await getLocale();
  const orders = await Promise.all((await listOrdersForUser(user.id)).map((o) => toOrderView(o, locale)));
  const { id: _id, ...publicUser } = user;
  return <AccountView user={publicUser} orders={orders} />;
}
