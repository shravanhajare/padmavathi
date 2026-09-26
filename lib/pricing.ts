/**
 * Pricing rules shared by the cart UI and the server. The server always
 * recomputes totals from the catalogue, so client-side prices are never trusted.
 */
export type Fulfilment = 'ship' | 'pickup';

export const ZONES: Record<Fulfilment, { label: string; short: string; fee: number; freeAbove: number }> = {
  /** Courier anywhere in India */
  ship: { label: 'Delivery across India', short: 'Delivery', fee: 99, freeAbove: 1499 },
  /** Collect from the workshop */
  pickup: { label: 'Pickup from the workshop', short: 'Pickup', fee: 0, freeAbove: 0 },
};

export const PRICING = {
  currency: 'INR',
  /**
   * GST on wooden tableware & kitchenware (HSN 4419). Catalogue prices are GST
   * exclusive. Confirm the current rate with your accountant before going live.
   */
  gstRate: 0.05,
  /** Orders at or above this many pieces are nudged towards a wholesale quote. */
  bulkPieces: 25,
} as const;

export interface PricedLine {
  price: number;
  qty: number;
}

export interface Totals {
  subtotal: number;
  delivery: number;
  tax: number;
  total: number;
  /** How much more to spend to unlock free delivery (0 when unlocked). */
  freeDeliveryGap: number;
}

export function computeTotals(lines: PricedLine[], fulfilment: Fulfilment = 'ship'): Totals {
  const zone = ZONES[fulfilment];
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const qualifies = subtotal >= zone.freeAbove;
  const delivery = subtotal === 0 || qualifies ? 0 : zone.fee;
  const tax = Math.round(subtotal * PRICING.gstRate);
  return {
    subtotal,
    delivery,
    tax,
    total: subtotal + delivery + tax,
    freeDeliveryGap: qualifies ? 0 : Math.max(0, zone.freeAbove - subtotal),
  };
}
