import { z } from 'zod';
import { enquirySchema } from '@/lib/validation/checkout';
import { clientKey, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, 'contact'), 5, 60_000)) return json({ ok: false, error: 'Too many messages, please try again shortly.' }, 429);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: 'Please check the form.', fields: z.flattenError(parsed.error).fieldErrors }, 400);
  if (parsed.data.website) return json({ ok: true }); // honeypot tripped: pretend success
  // TODO(shop owner): forward the enquiry by email (Resend, SES…) or to your CRM / Google Sheet.
  console.info('[contact] new enquiry', { ...parsed.data, website: undefined });
  return json({ ok: true });
}
