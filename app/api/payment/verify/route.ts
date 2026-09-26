import { verifySchema } from '@/lib/validation/checkout';
import { getPaymentProvider } from '@/lib/payments';
import { clientKey, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, 'verify'), 20, 60_000)) return json({ verified: false, error: 'Too many attempts.' }, 429);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ verified: false, error: 'Invalid request.' }, 400);
  }
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return json({ verified: false, error: 'Invalid payment details.' }, 400);

  const provider = getPaymentProvider();
  if (!provider || provider.id !== parsed.data.provider) {
    return json({ verified: false, error: 'Payment provider mismatch.' }, 400);
  }
  const verified = await provider.verifyPayment(parsed.data);
  if (!verified) {
    console.warn('[payment] signature verification failed for', parsed.data.orderId);
    return json({ verified: false, error: 'We could not verify this payment.' }, 400);
  }
  // TODO: persist the order as paid (database / Google Sheet / email) here.
  // For resilience also subscribe to the `payment.captured` webhook in Razorpay.
  console.info('[payment] verified', parsed.data.orderId, parsed.data.paymentId);
  return json({ verified: true });
}
