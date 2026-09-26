export type PaymentProviderId = 'razorpay' | 'stripe' | 'mock';

export interface CreatedOrder {
  provider: PaymentProviderId;
  /** Provider order id (Razorpay: order_xxx). */
  orderId: string;
  /** Amount in the smallest currency unit (paise). */
  amount: number;
  currency: 'INR';
  /** Public key the browser needs to open checkout (never the secret). */
  keyId?: string;
}

export interface VerifyInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * The seam that lets payment providers be swapped. Razorpay is the default;
 * see providers/stripe.ts for how a Stripe implementation slots in.
 */
export interface PaymentProvider {
  id: PaymentProviderId;
  mode: 'test' | 'live' | 'demo';
  createOrder(input: { amount: number; receipt: string; notes: Record<string, string> }): Promise<CreatedOrder>;
  verifyPayment(input: VerifyInput): Promise<boolean>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
