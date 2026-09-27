import 'server-only';
import type { Locale } from '@/i18n/config';
import { computeTotals, PRICING, type Fulfilment } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';
import type { OrderDetails } from '@/lib/validation/forms';
import { getCatalog } from './catalog';
import { sql } from './db';

export type OrderStatus = 'new' | 'confirmed' | 'in_production' | 'dispatched' | 'delivered' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'in_production', 'dispatched', 'delivered', 'cancelled'];

export interface OrderLine {
  productId: string;
  variantId: string;
  /** English names, as the workshop reads them */
  name: string;
  variantLabel: string;
  image: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface OrderRow {
  id: string;
  number: number;
  user_id: string | null;
  status: OrderStatus;
  customer: { name: string; phone: string; email: string; business: string; gstin: string };
  fulfilment: Fulfilment;
  address: { address: string; landmark: string; city: string; state: string; pincode: string } | null;
  notes: string | null;
  items: OrderLine[];
  subtotal: number;
  delivery: number;
  tax: number;
  total: number;
  lang: Locale;
  whatsapp_notified: boolean;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
  needed_by?: string | null;
}

export type PricingProblem = { kind: 'unavailable' } | { kind: 'min'; productId: string; min: number };

/** Re-prices the cart from the live catalogue and enforces the bulk minimum. The server never trusts client prices. */
export async function priceItems(items: Array<{ productId: string; variantId: string; qty: number }>, minQty: number) {
  const catalog = await getCatalog();
  const lines: OrderLine[] = [];
  for (const item of items) {
    const product = catalog.find((e) => e.product.id === item.productId)?.product;
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant) return { ok: false as const, problem: { kind: 'unavailable' } as PricingProblem };
    if (item.qty < minQty) return { ok: false as const, problem: { kind: 'min', productId: product.id, min: minQty } as PricingProblem };
    const existing = lines.find((l) => l.productId === product.id && l.variantId === variant.id);
    if (existing) {
      existing.qty += item.qty;
      existing.lineTotal = existing.price * existing.qty;
      continue;
    }
    lines.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      image: product.image,
      price: variant.price,
      qty: item.qty,
      lineTotal: variant.price * item.qty,
    });
  }
  return { ok: true as const, lines, totals: computeTotals(lines) };
}

export async function insertOrder(args: {
  userId: string;
  details: OrderDetails;
  lines: OrderLine[];
  totals: { subtotal: number; tax: number; total: number };
  lang: Locale;
}) {
  const { details: d } = args;
  const notes = [d.neededBy ? `Needed by: ${d.neededBy}` : '', d.notes].filter(Boolean).join('\n') || null;
  const rows = await sql<OrderRow>(
    `insert into public.orders (user_id, customer, fulfilment, address, notes, items, subtotal, delivery, tax, total, lang)
     values ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10) returning *`,
    [
      args.userId,
      JSON.stringify({ name: d.name, phone: d.phone, email: d.email, business: d.business, gstin: d.gstin }),
      d.fulfilment,
      d.fulfilment === 'ship' ? JSON.stringify({ address: d.address, landmark: d.landmark, city: d.city, state: d.state, pincode: d.pincode }) : null,
      notes,
      JSON.stringify(args.lines),
      args.totals.subtotal,
      args.totals.tax,
      args.totals.total,
      args.lang,
    ],
  );
  return rows[0];
}

/** The message the workshop receives on WhatsApp. Always English, like the admin. */
export function orderMessage(o: OrderRow) {
  const c = o.customer;
  const a = o.address;
  const lines = o.items.map((l, i) => `${i + 1}. ${l.name} (${l.variantLabel}) × ${l.qty} @ ${formatINR(l.price)} = ${formatINR(l.lineTotal)}`);
  return [
    `🪵 *New bulk order #${o.number}*`,
    '',
    ...lines,
    '',
    `Subtotal: ${formatINR(o.subtotal)}`,
    `GST (${Math.round(PRICING.gstRate * 100)}%): ${formatINR(o.tax)}`,
    `*Estimated total: ${formatINR(o.total)}* (delivery to be quoted)`,
    '',
    `👤 ${c.name} · ${c.phone}`,
    c.business ? `🏢 ${c.business}${c.gstin ? ` · GSTIN ${c.gstin}` : ''}` : null,
    c.email ? `✉️ ${c.email}` : null,
    o.fulfilment === 'pickup' ? '📦 Pickup from the workshop' : `🚚 Deliver to: ${[a?.address, a?.landmark, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ')}`,
    o.notes ? `📝 ${o.notes}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

export async function markNotified(id: string) {
  await sql('update public.orders set whatsapp_notified = true where id = $1', [id]);
}

export async function getOrderByNumber(number: number) {
  const rows = await sql<OrderRow>('select * from public.orders where number = $1', [number]);
  return rows[0] ?? null;
}

export async function listOrdersForUser(userId: string) {
  return sql<OrderRow>('select * from public.orders where user_id = $1 order by created_at desc limit 200', [userId]);
}

/** Plain data for rendering an order, with item names in the viewer's language. */
export interface OrderView {
  number: number;
  status: OrderStatus;
  createdAt: string;
  fulfilment: Fulfilment;
  customer: OrderRow['customer'];
  address: OrderRow['address'];
  notes: string | null;
  items: Array<{ key: string; name: string; variantLabel: string; image: string; qty: number; price: number; lineTotal: number }>;
  subtotal: number;
  tax: number;
  total: number;
  whatsappNotified: boolean;
}

export async function toOrderView(o: OrderRow, locale: Locale): Promise<OrderView> {
  const { localizeProduct } = await import('@/lib/catalog');
  const catalog = await getCatalog({ includeInactive: true });
  return {
    number: o.number,
    status: o.status,
    createdAt: new Date(o.created_at).toISOString(),
    fulfilment: o.fulfilment,
    customer: o.customer,
    address: o.address,
    notes: o.notes,
    items: o.items.map((l) => {
      const entry = catalog.find((e) => e.product.id === l.productId);
      const p = entry ? localizeProduct(entry.product, entry.i18n, locale) : null;
      return {
        key: `${l.productId}:${l.variantId}`,
        name: p?.name ?? l.name,
        variantLabel: p?.variants.find((v) => v.id === l.variantId)?.label ?? l.variantLabel,
        image: l.image,
        qty: l.qty,
        price: l.price,
        lineTotal: l.lineTotal,
      };
    }),
    subtotal: o.subtotal,
    tax: o.tax,
    total: o.total,
    whatsappNotified: o.whatsapp_notified,
  };
}
