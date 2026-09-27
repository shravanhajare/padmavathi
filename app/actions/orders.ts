'use server';

import { getLocale } from '@/i18n/server';
import { getCurrentUser } from '@/lib/server/auth';
import { hasDatabase, sql } from '@/lib/server/db';
import { insertOrder, markNotified, orderMessage, priceItems } from '@/lib/server/orders';
import { getSettings } from '@/lib/server/settings';
import { notifyWhatsApp } from '@/lib/server/whatsapp';
import { normalizePhone } from '@/lib/phone';
import { actionKey, rateLimit } from '@/lib/rateLimit';
import { enquirySchema, fieldErrors, orderDetailsSchema, orderItemsSchema, type EnquiryInput, type OrderDetailsInput } from '@/lib/validation/forms';
import type { ActionState } from './types';

export async function placeOrderAction(
  details: OrderDetailsInput,
  items: Array<{ productId: string; variantId: string; qty: number }>,
): Promise<ActionState<{ number: number }>> {
  if (!hasDatabase()) return { ok: false, error: 'noDatabase' };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'loginFirst' };
  if (!rateLimit(await actionKey(`order:${user.id}`), 6, 10 * 60_000)) return { ok: false, error: 'rateLimited' };

  const parsed = orderDetailsSchema.safeParse(details);
  if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
  const parsedItems = orderItemsSchema.safeParse(items);
  if (!parsedItems.success) return { ok: false, error: 'empty' };

  const settings = await getSettings();
  const priced = await priceItems(parsedItems.data, settings.minOrderQty);
  if (!priced.ok) {
    return priced.problem.kind === 'min'
      ? { ok: false, error: 'min', detail: { productId: priced.problem.productId, min: priced.problem.min } }
      : { ok: false, error: 'unavailable' };
  }

  const d = { ...parsed.data, phone: normalizePhone(parsed.data.phone)! };
  const order = await insertOrder({ userId: user.id, details: d, lines: priced.lines, totals: priced.totals, lang: await getLocale() });

  // remember what they typed for next time
  await sql(
    `update public.users set business_name = coalesce(nullif($2, ''), business_name), gstin = coalesce(nullif($3, ''), gstin), city = coalesce(nullif($4, ''), city) where id = $1`,
    [user.id, d.business, d.gstin, d.city],
  );

  if (await notifyWhatsApp(settings.whatsappOrderNumber, orderMessage(order))) await markNotified(order.id);
  return { ok: true, number: order.number };
}

export async function sendEnquiryAction(input: EnquiryInput): Promise<ActionState> {
  if (!rateLimit(await actionKey('enquiry'), 5, 60_000)) return { ok: false, error: 'rateLimited' };
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
  if (parsed.data.website) return { ok: true }; // honeypot tripped: pretend success
  if (!hasDatabase()) return { ok: false, error: 'noDatabase' };
  const e = parsed.data;
  await sql('insert into public.enquiries (type, name, phone, message) values ($1, $2, $3, $4)', [e.type, e.name, normalizePhone(e.phone) ?? e.phone, e.message]);
  const settings = await getSettings();
  await notifyWhatsApp(settings.whatsappOrderNumber, `📩 *New ${e.type} enquiry*\n${e.name} · ${e.phone}\n\n${e.message}`);
  return { ok: true };
}
