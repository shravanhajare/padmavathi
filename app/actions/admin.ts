'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CategoryId, ModelKind, Product, ProductTag, WoodId } from '@/data/types';
import { CATEGORY_IDS, MODEL_KINDS, TAGS, WOOD_IDS } from '@/lib/productOptions';
import type { ProductI18n } from '@/i18n/config';
import { getCurrentUser, hashPassword } from '@/lib/server/auth';
import { getCatalogEntry, invalidateCatalog } from '@/lib/server/catalog';
import { sql } from '@/lib/server/db';
import { ORDER_STATUSES } from '@/lib/server/orders';
import { saveSettings } from '@/lib/server/settings';
import type { ActionState } from './types';

async function admin() {
  const user = await getCurrentUser();
  return user?.role === 'admin' ? user : null;
}
const forbidden = { ok: false as const, error: 'forbidden' as const };

// ─── orders ──────────────────────────────────────────────────────────────────

export async function updateOrderAction(number: number, status: string, adminNotes: string): Promise<ActionState> {
  if (!(await admin())) return forbidden;
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return { ok: false, error: 'generic' };
  await sql('update public.orders set status = $2, admin_notes = nullif($3, $4), updated_at = now() where number = $1', [number, status, adminNotes.slice(0, 2000), '']);
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

// ─── products ────────────────────────────────────────────────────────────────

const text = (max: number) => z.string().trim().max(max);
const translation = z.object({ name: text(120), localName: text(80), description: text(300), story: text(2000), finish: text(200), includes: text(1500) });

const productFormSchema = z.object({
  isNew: z.boolean(),
  id: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  category: z.enum(CATEGORY_IDS as [CategoryId, ...CategoryId[]]),
  wood: z.enum(WOOD_IDS as [WoodId, ...WoodId[]]),
  modelKind: z.enum(MODEL_KINDS as [ModelKind, ...ModelKind[]]),
  modelVariant: text(40),
  image: z.string().trim().regex(/^(\/|https:\/\/)\S+$/).max(300),
  tags: z.array(z.enum(TAGS as [ProductTag, ...ProductTag[]])).max(6),
  popularity: z.number().int().min(0).max(100),
  active: z.boolean(),
  en: translation.extend({ name: z.string().trim().min(2).max(120), description: z.string().trim().min(2).max(300), dimensions: text(80), weight: text(40) }),
  kn: translation,
  hi: translation,
  variants: z
    .array(
      z.object({
        id: z.string().trim().regex(/^[a-z0-9-]+$/).max(30),
        label: z.string().trim().min(1).max(60),
        labelKn: text(60),
        labelHi: text(60),
        price: z.number().int().min(1).max(10_000_000),
        dimensions: text(80),
        weight: text(40),
      }),
    )
    .min(1)
    .max(12)
    .refine((vs) => new Set(vs.map((v) => v.id)).size === vs.length),
});
export type ProductForm = z.input<typeof productFormSchema>;

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

export async function saveProductAction(input: ProductForm): Promise<ActionState<{ id: string }>> {
  if (!(await admin())) return forbidden;
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, 'tooLong'> = {};
    for (const i of parsed.error.issues) fields[i.path.join('.')] = 'tooLong';
    return { ok: false, error: 'invalid', fields };
  }
  const f = parsed.data;
  const existing = await getCatalogEntry(f.id);
  if (f.isNew && existing) return { ok: false, error: 'idTaken' };
  if (!f.isNew && !existing) return { ok: false, error: 'unavailable' };

  const product: Product = {
    ...(existing?.product ?? {}),
    id: f.id,
    name: f.en.name,
    localName: f.en.localName || undefined,
    category: f.category,
    wood: f.wood,
    description: f.en.description,
    story: f.en.story || f.en.description,
    variants: f.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, dimensions: v.dimensions || undefined, weight: v.weight || undefined })),
    dimensions: f.en.dimensions,
    weight: f.en.weight,
    finish: f.en.finish,
    image: f.image,
    model: { kind: f.modelKind, variant: f.modelVariant || undefined, wood: f.wood },
    tags: f.tags,
    popularity: f.popularity,
    addedAt: existing?.product.addedAt ?? new Date().toISOString().slice(0, 10),
    includes: lines(f.en.includes).length ? lines(f.en.includes) : undefined,
  };
  const i18n: ProductI18n = {};
  for (const l of ['kn', 'hi'] as const) {
    const tr = f[l];
    const labels = Object.fromEntries(f.variants.map((v) => [v.id, l === 'kn' ? v.labelKn : v.labelHi]).filter(([, v]) => v));
    i18n[l] = {
      name: tr.name || undefined,
      localName: tr.localName || undefined,
      description: tr.description || undefined,
      story: tr.story || undefined,
      finish: tr.finish || undefined,
      includes: lines(tr.includes).length ? lines(tr.includes) : undefined,
      variants: Object.keys(labels).length ? labels : undefined,
    };
  }
  await sql(
    `insert into public.products (id, data, i18n, active, sort_order)
     values ($1, $2, $3, $4, (select coalesce(max(sort_order), 0) + 1 from public.products))
     on conflict (id) do update set data = excluded.data, i18n = excluded.i18n, active = excluded.active, updated_at = now()`,
    [f.id, JSON.stringify(product), JSON.stringify(i18n), f.active],
  );
  invalidateCatalog();
  revalidatePath('/', 'layout');
  return { ok: true, id: f.id };
}

export async function setProductActiveAction(id: string, active: boolean): Promise<ActionState> {
  if (!(await admin())) return forbidden;
  await sql('update public.products set active = $2, updated_at = now() where id = $1', [id, active]);
  invalidateCatalog();
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ─── customers ───────────────────────────────────────────────────────────────

export async function setUserRoleAction(userId: string, role: 'customer' | 'admin'): Promise<ActionState> {
  const me = await admin();
  if (!me || me.id === userId) return forbidden; // never demote yourself
  await sql('update public.users set role = $2 where id = $1', [userId, role === 'admin' ? 'admin' : 'customer']);
  revalidatePath('/admin/customers');
  return { ok: true };
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionState> {
  const me = await admin();
  if (!me || me.id === userId) return forbidden;
  await sql('update public.users set is_active = $2 where id = $1', [userId, active]);
  if (!active) await sql('delete from public.sessions where user_id = $1', [userId]);
  revalidatePath('/admin/customers');
  return { ok: true };
}

export async function setUserPasswordAction(userId: string, password: string): Promise<ActionState> {
  if (!(await admin())) return forbidden;
  if (password.length < 8 || password.length > 100) return { ok: false, error: 'password' };
  await sql('update public.users set password_hash = $2 where id = $1', [userId, await hashPassword(password)]);
  await sql('delete from public.sessions where user_id = $1', [userId]);
  return { ok: true };
}

// ─── enquiries & settings ────────────────────────────────────────────────────

export async function setEnquiryStatusAction(id: string, status: 'new' | 'handled'): Promise<ActionState> {
  if (!(await admin())) return forbidden;
  await sql('update public.enquiries set status = $2 where id = $1', [id, status === 'handled' ? 'handled' : 'new']);
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

const optionalUrl = z.union([z.literal(''), z.string().trim().max(300).regex(/^https?:\/\/\S+$/)]);
const settingsSchema = z.object({
  minOrderQty: z.number().int().min(1).max(1000),
  whatsappOrderNumber: z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().min(11).max(15)),
  business: z.object({
    phone: z.string().trim().min(8).max(24).regex(/^[+\d][\d\s()-]+$/),
    email: z.union([z.literal(''), z.string().trim().max(120).pipe(z.email())]),
    address: z.object({ line1: text(160), line2: text(160), city: text(80), state: text(80), pincode: text(12) }),
    mapQuery: text(200),
    socials: z.object({ instagram: optionalUrl, facebook: optionalUrl, youtube: optionalUrl }),
  }),
});
export type SettingsForm = z.input<typeof settingsSchema>;

export async function saveSettingsAction(form: SettingsForm): Promise<ActionState> {
  if (!(await admin())) return forbidden;
  const parsed = settingsSchema.safeParse(form);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), 'generic' as const]));
    return { ok: false, fields };
  }
  await saveSettings(parsed.data);
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ─── reviews ─────────────────────────────────────────────────────────────────

const reviewText = z.object({ city: text(80), product: text(120), quote: text(600) });
const reviewSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  active: z.boolean(),
  i18n: z.object({
    en: z.object({ city: text(80).min(1), product: text(120).min(1), quote: text(600).min(1) }),
    kn: reviewText,
    hi: reviewText,
  }),
});
export type ReviewForm = z.input<typeof reviewSchema>;

export async function saveReviewAction(form: ReviewForm): Promise<ActionState<{ id: string }>> {
  if (!(await admin())) return forbidden;
  const parsed = reviewSchema.safeParse(form);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const r = parsed.data;
  const [row] = r.id
    ? await sql<{ id: string }>('update public.reviews set name = $2, rating = $3, i18n = $4, active = $5 where id = $1 returning id', [r.id, r.name, r.rating, JSON.stringify(r.i18n), r.active])
    : await sql<{ id: string }>(
        `insert into public.reviews (name, rating, i18n, active, sort_order)
         values ($1, $2, $3, $4, (select coalesce(max(sort_order), 0) + 1 from public.reviews)) returning id`,
        [r.name, r.rating, JSON.stringify(r.i18n), r.active],
      );
  if (!row) return { ok: false, error: 'generic' };
  revalidatePath('/', 'layout');
  return { ok: true, id: row.id };
}

export async function deleteReviewAction(id: string): Promise<ActionState> {
  if (!(await admin())) return forbidden;
  await sql('delete from public.reviews where id = $1', [id]);
  revalidatePath('/', 'layout');
  return { ok: true };
}
