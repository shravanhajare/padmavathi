import { z } from 'zod';
import type { Messages } from '@/i18n/messages';

/**
 * Schemas shared by the forms (client) and the server actions. Error messages
 * are keys into `t.common.errors`, so each visitor sees them in their language.
 */
export type ErrorKey = keyof Messages['common']['errors'];
const e = (key: ErrorKey) => ({ message: key });

const PHONE_RE = /^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
/** 15-character GSTIN: state code, PAN, entity number, Z, checksum. */
export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const name = z.string().trim().min(2, e('name')).max(80, e('nameLong'));
const phone = z.string().trim().regex(PHONE_RE, e('phone'));
const optionalEmail = z
  .string()
  .trim()
  .max(120, e('tooLong'))
  .refine((v) => v === '' || z.email().safeParse(v).success, e('email'));
const requiredEmail = z
  .string()
  .trim()
  .min(1, e('email'))
  .max(120, e('tooLong'))
  .refine((v) => z.email().safeParse(v).success, e('email'));
const short = (max: number) => z.string().trim().max(max, e('tooLong'));
const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => v === '' || GSTIN_RE.test(v), e('gstin'));
const password = z.string().min(8, e('password')).max(100, e('tooLong'));

// ─── accounts ────────────────────────────────────────────────────────────────

export const loginSchema = z.object({ email: requiredEmail, password: z.string().min(1, e('password')).max(100) });

export const registerSchema = z
  .object({ name, phone, email: requiredEmail, business: short(120), city: short(60), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], ...e('passwordMatch') });

export const profileSchema = z.object({ name, email: optionalEmail, business: short(120), gstin, city: short(60) });

export const passwordSchema = z
  .object({ current: z.string().min(1, e('password')), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], ...e('passwordMatch') });

// ─── orders ──────────────────────────────────────────────────────────────────

export const orderDetailsSchema = z
  .object({
    fulfilment: z.enum(['ship', 'pickup']),
    name,
    phone,
    email: optionalEmail,
    business: short(120),
    gstin,
    address: short(240),
    landmark: short(120),
    city: short(60),
    state: short(60),
    pincode: short(6),
    neededBy: z.string().trim().refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), e('tooLong')),
    notes: z.string().trim().max(600, e('notesLong')),
  })
  .superRefine((v, ctx) => {
    if (v.fulfilment !== 'ship') return;
    if (v.address.length < 10) ctx.addIssue({ code: 'custom', path: ['address'], message: 'address' });
    if (v.city.length < 2) ctx.addIssue({ code: 'custom', path: ['city'], message: 'city' });
    if (v.state.length < 2) ctx.addIssue({ code: 'custom', path: ['state'], message: 'state' });
    if (!PINCODE_RE.test(v.pincode)) ctx.addIssue({ code: 'custom', path: ['pincode'], message: 'pincode' });
  });

export type OrderDetails = z.output<typeof orderDetailsSchema>;
export type OrderDetailsInput = z.input<typeof orderDetailsSchema>;

export const orderItemsSchema = z
  .array(z.object({ productId: z.string().min(1).max(80), variantId: z.string().min(1).max(40), qty: z.number().int().min(1).max(100_000) }))
  .min(1)
  .max(60);

// ─── enquiries ───────────────────────────────────────────────────────────────

export const ENQUIRY_TYPES = ['bulk', 'wholesale', 'gifting', 'custom'] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const enquirySchema = z.object({
  name,
  phone,
  type: z.enum(ENQUIRY_TYPES, e('type')),
  message: z.string().trim().min(10, e('message')).max(1000, e('tooLong')),
  /** honeypot: real people never fill this in */
  website: z.string().max(0).optional(),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

/** First error per field, as translation keys. */
export function fieldErrors(error: z.ZodError): Record<string, ErrorKey> {
  const out: Record<string, ErrorKey> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message as ErrorKey;
  }
  return out;
}
