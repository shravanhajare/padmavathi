/**
 * Pricing rules shared by the cart UI and the server. The server always
 * recomputes totals from the catalogue, so client-side prices are never trusted.
 * Delivery for bulk orders is quoted on WhatsApp, so it is not in the total.
 */
export type Fulfilment = 'ship' | 'pickup';

export const PRICING = {
  currency: 'INR',
  /**
   * GST on wooden tableware & kitchenware (HSN 4419). Catalogue prices are GST
   * exclusive. Confirm the current rate with your accountant.
   */
  gstRate: 0.05,
} as const;

export interface PricedLine {
  price: number;
  qty: number;
}

export interface Totals {
  subtotal: number;
  tax: number;
  total: number;
}

export function computeTotals(lines: PricedLine[]): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const tax = Math.round(subtotal * PRICING.gstRate);
  return { subtotal, tax, total: subtotal + tax };
}
