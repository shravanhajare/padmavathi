import { z } from 'zod';

/** Shared by the checkout / enquiry forms (client) and the API routes (server). */

const PHONE_RE = /^(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
/** 15-character GSTIN: state code, PAN, entity number, Z, checksum. */
export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const customerSchema = z
  .object({
    fulfilment: z.enum(['ship', 'pickup']),
    name: z.string().trim().min(2, 'Please enter your full name.').max(80, 'That name is a little long.'),
    phone: z.string().trim().regex(PHONE_RE, 'Enter a 10-digit Indian mobile number.'),
    email: z.string().trim().email('Enter a valid email address.').max(120),
    address: z.string().trim().max(240, 'Please shorten the address.'),
    landmark: z.string().trim().max(120),
    city: z.string().trim().max(60),
    state: z.string().trim().max(60),
    pincode: z.string().trim().max(6),
    notes: z.string().trim().max(400, 'Please keep notes under 400 characters.'),
    bulk: z.boolean(),
    businessName: z.string().trim().max(120),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .max(15)
      .refine((v) => v === '' || GSTIN_RE.test(v), 'Enter a valid 15-character GSTIN, e.g. 29ABCDE1234F1Z5.'),
  })
  .superRefine((v, ctx) => {
    if (v.fulfilment === 'ship') {
      if (v.address.length < 10) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Please enter your full street address.' });
      if (v.city.length < 2) ctx.addIssue({ code: 'custom', path: ['city'], message: 'Enter your city.' });
      if (v.state.length < 2) ctx.addIssue({ code: 'custom', path: ['state'], message: 'Enter your state.' });
      if (!PINCODE_RE.test(v.pincode)) ctx.addIssue({ code: 'custom', path: ['pincode'], message: 'Enter a valid 6-digit pincode.' });
    }
    if (v.bulk && v.businessName.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['businessName'], message: 'Enter the business or organisation name for the invoice.' });
    }
  });

export type CustomerInput = z.input<typeof customerSchema>;
export type CustomerData = z.output<typeof customerSchema>;

export const orderItemSchema = z.object({
  productId: z.string().min(1).max(80),
  variantId: z.string().min(1).max(40),
  qty: z.number().int().min(1).max(500),
});

export const createOrderSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1, 'Your cart is empty.').max(40),
});

export const verifySchema = z.object({
  provider: z.enum(['razorpay', 'mock']),
  orderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().max(200),
});

export const ENQUIRY_TYPES = [
  { id: 'retail', label: 'Retail order' },
  { id: 'bulk', label: 'Bulk order' },
  { id: 'wholesale', label: 'Wholesale / reseller' },
  { id: 'custom', label: 'Custom order' },
] as const;

type EnquiryType = (typeof ENQUIRY_TYPES)[number]['id'];
const ENQUIRY_IDS = ENQUIRY_TYPES.map((e) => e.id) as [EnquiryType, ...EnquiryType[]];

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(80),
  phone: z.string().trim().regex(PHONE_RE, 'Enter a 10-digit Indian mobile number.'),
  type: z.enum(ENQUIRY_IDS, { message: 'Choose an enquiry type.' }),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters).').max(1000),
  /** honeypot: real people never fill this in */
  website: z.string().max(0).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
