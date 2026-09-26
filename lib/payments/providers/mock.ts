import 'server-only';
import { randomUUID } from 'node:crypto';
import type { PaymentProvider } from '../types';

/**
 * Demo provider used in development when no Razorpay keys are configured, so
 * the full checkout flow can be tried without an account. Never used in
 * production unless PAYMENT_PROVIDER=mock is set explicitly.
 */
export function mockProvider(): PaymentProvider {
  return {
    id: 'mock',
    mode: 'demo',
    async createOrder({ amount }) {
      return { provider: 'mock', orderId: `mock_order_${randomUUID().slice(0, 12)}`, amount, currency: 'INR' };
    },
    async verifyPayment({ orderId, paymentId }) {
      return orderId.startsWith('mock_order_') && paymentId.startsWith('mock_pay_');
    },
  };
}
