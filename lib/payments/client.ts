'use client';

import type { Totals } from '@/lib/pricing';
import type { PricedOrderLine } from '@/lib/orders';
import type { CreatedOrder } from './types';

export interface CreateOrderResponse extends CreatedOrder {
  receipt: string;
  mode: 'test' | 'live' | 'demo';
  totals: Totals;
  lines: PricedOrderLine[];
  prefill: { name: string; email: string; contact: string };
}

export type PaymentOutcome =
  | { status: 'paid'; orderId: string; paymentId: string; signature: string }
  | { status: 'failed'; reason: string }
  | { status: 'dismissed' };

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes?: Record<string, string>;
  theme: { color: string };
  modal: { ondismiss: () => void; confirm_close?: boolean };
  handler: (res: RazorpayResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', cb: (res: { error: { description?: string; reason?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<boolean> | null = null;

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => resolve(!!window.Razorpay);
      s.onerror = () => {
        loading = null;
        resolve(false);
      };
      document.body.appendChild(s);
    });
  }
  return loading;
}

/** Opens Razorpay Checkout (UPI, cards, netbanking, wallets) for a server-created order. */
export async function payWithRazorpay(order: CreateOrderResponse, shopName: string, logoUrl?: string): Promise<PaymentOutcome> {
  const ok = await loadRazorpay();
  if (!ok || !window.Razorpay) return { status: 'failed', reason: 'Could not load the payment window. Check your connection and try again.' };
  const key = order.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key) return { status: 'failed', reason: 'Payment key is missing.' };
  return new Promise<PaymentOutcome>((resolve) => {
    let settled = false;
    const done = (o: PaymentOutcome) => {
      if (settled) return;
      settled = true;
      resolve(o);
    };
    const rzp = new window.Razorpay!({
      key,
      amount: order.amount,
      currency: order.currency,
      name: shopName,
      description: `Order ${order.receipt}`,
      image: logoUrl,
      order_id: order.orderId,
      prefill: order.prefill,
      notes: { receipt: order.receipt },
      theme: { color: '#C68642' },
      modal: { ondismiss: () => done({ status: 'dismissed' }), confirm_close: true },
      handler: (res) =>
        done({ status: 'paid', orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature }),
    });
    rzp.on('payment.failed', (res) => done({ status: 'failed', reason: res.error.description || res.error.reason || 'Payment failed' }));
    rzp.open();
  });
}

export async function verifyPayment(provider: 'razorpay' | 'mock', outcome: Extract<PaymentOutcome, { status: 'paid' }>) {
  const res = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, orderId: outcome.orderId, paymentId: outcome.paymentId, signature: outcome.signature }),
  });
  const data = (await res.json().catch(() => ({}))) as { verified?: boolean; error?: string };
  return { verified: res.ok && data.verified === true, error: data.error };
}
