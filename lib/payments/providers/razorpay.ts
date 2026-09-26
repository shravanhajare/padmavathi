import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentError, type PaymentProvider } from '../types';

const API = 'https://api.razorpay.com/v1';

/**
 * Razorpay Orders API + signature verification.
 * Docs: https://razorpay.com/docs/payments/server-integration/nodejs/
 */
export function razorpayProvider(keyId: string, keySecret: string): PaymentProvider {
  const auth = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  return {
    id: 'razorpay',
    mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',

    async createOrder({ amount, receipt, notes }) {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ amount, currency: 'INR', receipt, notes }),
        cache: 'no-store',
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new PaymentError(`Razorpay could not create the order (HTTP ${res.status})`, detail);
      }
      const data = (await res.json()) as { id: string; amount: number };
      return { provider: 'razorpay', orderId: data.id, amount: data.amount, currency: 'INR', keyId };
    },

    async verifyPayment({ orderId, paymentId, signature }) {
      // signature = HMAC_SHA256(order_id + "|" + razorpay_payment_id, key_secret)
      const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      return a.length === b.length && timingSafeEqual(a, b);
    },
  };
}
