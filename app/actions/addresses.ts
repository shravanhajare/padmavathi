'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { sql } from '@/lib/server/db';
import type { ActionState } from './types';

const short = (max: number) => z.string().trim().min(1).max(max);

const addressSchema = z.object({
  id: z.string().uuid().nullable(),
  label: short(30),
  name: short(80),
  phone: z.string().trim().min(8).max(20),
  line1: short(240),
  landmark: z.string().trim().max(120).optional().default(''),
  city: short(60),
  state: short(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/),
  isDefault: z.boolean(),
});
export type AddressForm = z.input<typeof addressSchema>;

function refresh() {
  revalidatePath('/', 'layout');
}

export async function saveAddressAction(form: AddressForm): Promise<ActionState<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'loginFirst' };
  const parsed = addressSchema.safeParse(form);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const a = parsed.data;
  if (a.isDefault) await sql('update public.addresses set is_default = false where user_id = $1', [user.id]);
  const [row] = a.id
    ? await sql<{ id: string }>(
        `update public.addresses set label = $2, name = $3, phone = $4, line1 = $5, landmark = nullif($6, ''), city = $7, state = $8, pincode = $9, is_default = $10
         where id = $1 and user_id = $11 returning id`,
        [a.id, a.label, a.name, a.phone, a.line1, a.landmark, a.city, a.state, a.pincode, a.isDefault, user.id],
      )
    : await sql<{ id: string }>(
        `insert into public.addresses (user_id, label, name, phone, line1, landmark, city, state, pincode, is_default)
         values ($1, $2, $3, $4, $5, nullif($6, ''), $7, $8, $9, $10) returning id`,
        [user.id, a.label, a.name, a.phone, a.line1, a.landmark, a.city, a.state, a.pincode, a.isDefault],
      );
  if (!row) return { ok: false, error: 'generic' };
  // the first address saved becomes the default even if the box wasn't ticked
  await sql(
    `update public.addresses set is_default = true
     where id = $1 and not exists (select 1 from public.addresses where user_id = $2 and is_default)`,
    [row.id, user.id],
  );
  refresh();
  return { ok: true, id: row.id };
}

export async function deleteAddressAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'loginFirst' };
  await sql('delete from public.addresses where id = $1 and user_id = $2', [id, user.id]);
  await sql(
    `update public.addresses set is_default = true where user_id = $1 and id = (
       select id from public.addresses where user_id = $1 order by created_at desc limit 1
     ) and not exists (select 1 from public.addresses where user_id = $1 and is_default)`,
    [user.id],
  );
  refresh();
  return { ok: true };
}

export async function setDefaultAddressAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'loginFirst' };
  await sql('update public.addresses set is_default = false where user_id = $1', [user.id]);
  await sql('update public.addresses set is_default = true where id = $1 and user_id = $2', [id, user.id]);
  refresh();
  return { ok: true };
}
