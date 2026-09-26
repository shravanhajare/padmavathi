import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { createOrderSchema } from '@/lib/validation/checkout';
import { getPaymentProvider, PaymentError } from '@/lib/payments';
import { priceOrder, PricingError } from '@/lib/orders';
import { clientKey, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, 'order'), 12, 60_000)) {
    return json({ error: 'Too many attempts. Please wait a minute and try again.' }, 429);
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Please check your details and try again.', fields: z.flattenError(parsed.error).fieldErrors }, 400);
  }
  const { customer, items } = parsed.data;

  // re-price from the catalogue: browser-side prices are never trusted
  let priced;
  try {
    priced = priceOrder(items, customer.fulfilment);
  } catch (e) {
    if (e instanceof PricingError) return json({ error: e.message }, 409);
    throw e;
  }

  const provider = getPaymentProvider();
  if (!provider) {
    return json({ error: 'Online payments are not set up yet. Please order on WhatsApp or call us.' }, 503);
  }

  const receipt = `PE-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
  const itemsSummary = priced.lines.map((l) => `${l.qty}x ${l.name} (${l.variantLabel})`).join(', ');
  // Razorpay allows 15 notes of up to 256 characters each.
  const notes: Record<string, string> = {
    customer: customer.name,
    phone: customer.phone,
    email: customer.email,
    fulfilment: customer.fulfilment,
    items: itemsSummary.slice(0, 250),
  };
  if (customer.fulfilment === 'ship') {
    notes.address = `${customer.address}${customer.landmark ? `, ${customer.landmark}` : ''}`.slice(0, 250);
    notes.city = `${customer.city} ${customer.pincode}, ${customer.state}`.slice(0, 250);
  }
  if (customer.bulk) {
    notes.order_type = 'Bulk / wholesale';
    notes.business = customer.businessName.slice(0, 250);
    if (customer.gstin) notes.gstin = customer.gstin;
  }
  if (customer.notes) notes.notes = customer.notes.slice(0, 250);

  try {
    const order = await provider.createOrder({ amount: priced.totals.total * 100, receipt, notes });
    return json({
      ...order,
      receipt,
      mode: provider.mode,
      totals: priced.totals,
      lines: priced.lines,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone.replace(/\D/g, '').slice(-10) },
    });
  } catch (e) {
    console.error('[payment] create-order failed', e instanceof PaymentError ? e.detail : e);
    return json({ error: 'We could not start the payment. Please try again in a moment.' }, 502);
  }
}
