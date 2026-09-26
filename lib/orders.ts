import { getProduct } from '@/data/products';
import { computeTotals, type Fulfilment, type Totals } from '@/lib/pricing';

export interface PricedOrderLine {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  image: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export class PricingError extends Error {}

/** Re-prices a cart from the catalogue. The server never trusts client prices. */
export function priceOrder(items: Array<{ productId: string; variantId: string; qty: number }>, fulfilment: Fulfilment) {
  const lines: PricedOrderLine[] = items.map((item) => {
    const product = getProduct(item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant) throw new PricingError('Some items in your cart are no longer available. Please refresh your cart.');
    return {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      image: product.image,
      price: variant.price,
      qty: item.qty,
      lineTotal: variant.price * item.qty,
    };
  });
  const totals: Totals = computeTotals(lines, fulfilment);
  return { lines, totals };
}

/** What the success page shows. Stored in sessionStorage after a verified payment. */
export interface OrderSummary {
  ref: string;
  paymentId: string;
  mode: 'test' | 'live' | 'demo';
  placedAt: string;
  customer: { name: string; phone: string; email: string };
  fulfilment: Fulfilment;
  address?: string;
  business?: { name: string; gstin: string };
  lines: PricedOrderLine[];
  totals: Totals;
}

export const LAST_ORDER_KEY = 'pe-last-order';
