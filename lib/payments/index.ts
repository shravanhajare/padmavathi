import 'server-only';
import type { PaymentProvider } from './types';
import { razorpayProvider } from './providers/razorpay';
import { mockProvider } from './providers/mock';
import { stripeProvider } from './providers/stripe';

const configured = (v: string | undefined): v is string => !!v && !/x{6,}/i.test(v);

/** Picks the active payment provider from the environment. */
export function getPaymentProvider(): PaymentProvider | null {
  const forced = process.env.PAYMENT_PROVIDER;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (forced === 'mock') return mockProvider();
  if (forced === 'stripe') return stripeProvider();
  if (configured(keyId) && configured(secret)) return razorpayProvider(keyId, secret);
  if (process.env.NODE_ENV !== 'production') return mockProvider();
  return null;
}

export * from './types';
