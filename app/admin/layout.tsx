import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getT } from '@/i18n/server';
import { requireAdmin } from '@/lib/server/auth';
import { dashboardStats } from '@/lib/server/admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: { default: t.admin.title, template: `%s · ${t.admin.title}` }, robots: { index: false, follow: false } };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const stats = await dashboardStats();
  return (
    <div className="min-h-screen">
      <AdminHeader badges={{ orders: stats.newOrders, enquiries: stats.newEnquiries }} />
      <div className="container-page min-h-[70vh] pb-24 pt-6">{children}</div>
    </div>
  );
}
