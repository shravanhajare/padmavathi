import 'server-only';
import { PaymentError, type PaymentProvider } from '../types';

/**
 * Stripe drop-in skeleton. To switch providers:
 *   1. npm i stripe @stripe/stripe-js
 *   2. createOrder → stripe.paymentIntents.create({ amount, currency: 'inr', metadata: notes })
 *      and return { orderId: intent.id, keyId: STRIPE_PUBLISHABLE_KEY } plus the client secret.
 *   3. verifyPayment → retrieve the PaymentIntent and check status === 'succeeded'
 *      (or better, confirm via a webhook).
 *   4. On the client, add a 'stripe' branch in lib/payments/client.ts that mounts
 *      Stripe Elements / Payment Element.
 *   5. Set PAYMENT_PROVIDER=stripe.
 */
export function stripeProvider(): PaymentProvider {
  const fail = async (): Promise<never> => {
    throw new PaymentError('Stripe is not configured. See lib/payments/providers/stripe.ts.');
  };
  return { id: 'stripe', mode: 'test', createOrder: fail, verifyPayment: fail };
}
