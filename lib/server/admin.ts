import 'server-only';
import { sql } from './db';
import type { OrderRow, OrderStatus } from './orders';

export async function dashboardStats() {
  const [row] = await sql<{
    new_orders: string;
    open_orders: string;
    month_orders: string;
    month_value: string | null;
    customers: string;
    new_enquiries: string;
  }>(`
    select
      (select count(*) from public.orders where status = 'new') as new_orders,
      (select count(*) from public.orders where status in ('new', 'confirmed', 'in_production')) as open_orders,
      (select count(*) from public.orders where created_at >= date_trunc('month', now()) and status <> 'cancelled') as month_orders,
      (select sum(total) from public.orders where created_at >= date_trunc('month', now()) and status <> 'cancelled') as month_value,
      (select count(*) from public.users where role = 'customer') as customers,
      (select count(*) from public.enquiries where status = 'new') as new_enquiries`);
  return {
    newOrders: Number(row.new_orders),
    openOrders: Number(row.open_orders),
    monthOrders: Number(row.month_orders),
    monthValue: Number(row.month_value ?? 0),
    customers: Number(row.customers),
    newEnquiries: Number(row.new_enquiries),
  };
}

export async function listOrders({ status, q, limit = 100 }: { status?: OrderStatus; q?: string; limit?: number }) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  const term = q?.trim();
  if (term) {
    params.push(`%${term.replace(/[%_]/g, '')}%`);
    const p = `$${params.length}`;
    where.push(`(number::text ilike ${p} or customer->>'name' ilike ${p} or customer->>'phone' ilike ${p} or customer->>'business' ilike ${p})`);
  }
  params.push(limit);
  return sql<OrderRow>(
    `select * from public.orders ${where.length ? `where ${where.join(' and ')}` : ''} order by created_at desc limit $${params.length}`,
    params,
  );
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  business_name: string | null;
  city: string | null;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: Date;
  orders: string;
}

export async function listCustomers() {
  return sql<CustomerRow>(`
    select u.id, u.name, u.phone, u.email, u.business_name, u.city, u.role, u.is_active, u.created_at,
           (select count(*) from public.orders o where o.user_id = u.id) as orders
      from public.users u order by u.created_at desc limit 500`);
}

export interface EnquiryRow {
  id: string;
  type: string;
  name: string;
  phone: string;
  message: string;
  status: 'new' | 'handled';
  created_at: Date;
}

export async function listEnquiries() {
  return sql<EnquiryRow>('select * from public.enquiries order by (status = $1) desc, created_at desc limit 300', ['new']);
}
