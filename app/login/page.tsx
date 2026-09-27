import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/AuthForms';
import { getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/server/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.orders.auth.loginMeta, robots: { index: false, follow: false } };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next?.startsWith('/') && !next.startsWith('//') ? next : undefined;
  const user = await getCurrentUser();
  if (user) redirect(safe ?? (user.role === 'admin' ? '/admin' : '/account'));
  return <LoginForm next={safe} />;
}
