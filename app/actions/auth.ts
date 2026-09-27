'use server';

import { redirect } from 'next/navigation';
import { clearFailedLogins, createSession, destroySession, getCurrentUser, hashPassword, isLocked, recordFailedLogin, timingDummyHash, verifyPassword } from '@/lib/server/auth';
import { hasDatabase, sql } from '@/lib/server/db';
import { normalizePhone } from '@/lib/phone';
import { actionKey, rateLimit } from '@/lib/rateLimit';
import { fieldErrors, loginSchema, passwordSchema, profileSchema, registerSchema } from '@/lib/validation/forms';
import type { ActionState } from './types';

/** Only same-site paths, so ?next= can't bounce people to another site. */
function safeNext(v: FormDataEntryValue | null, fallback = '/account') {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\') ? s : fallback;
}

const isUnique = (err: unknown, constraint: string) =>
  typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505' && String((err as { constraint?: string }).constraint).includes(constraint);

export async function registerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!hasDatabase()) return { ok: false, error: 'noDatabase' };
  if (!rateLimit(await actionKey('register'), 5, 10 * 60_000)) return { ok: false, error: 'rateLimited' };
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
  const d = parsed.data;
  const phone = normalizePhone(d.phone)!;
  let userId: string;
  try {
    const rows = await sql<{ id: string }>(
      `insert into public.users (name, phone, email, business_name, city, password_hash)
       values ($1, $2, $3, nullif($4, ''), nullif($5, ''), $6) returning id`,
      [d.name, phone, d.email.toLowerCase(), d.business, d.city, await hashPassword(d.password)],
    );
    userId = rows[0].id;
  } catch (err) {
    if (isUnique(err, 'phone')) return { ok: false, error: 'phoneTaken' };
    if (isUnique(err, 'email')) return { ok: false, error: 'emailTaken' };
    console.error('[register]', err);
    return { ok: false, error: 'generic' };
  }
  await createSession(userId, 'customer');
  redirect(safeNext(form.get('next')));
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!hasDatabase()) return { ok: false, error: 'noDatabase' };
  if (!rateLimit(await actionKey('login'), 10, 10 * 60_000)) return { ok: false, error: 'rateLimited' };
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
  const email = parsed.data.email.trim().toLowerCase();
  const rows = await sql<{ id: string; password_hash: string; role: 'customer' | 'admin'; is_active: boolean; failed_logins: number; locked_until: string | null }>(
    'select id, password_hash, role, is_active, failed_logins, locked_until from public.users where email = $1',
    [email],
  );
  const user = rows[0];
  // an existing account that's temporarily locked out: say so without checking the password
  if (user && isLocked(user)) return { ok: false, error: 'accountLocked' };
  // compare against a dummy hash when the email is unknown, so timing doesn't reveal registered addresses
  const ok = await verifyPassword(parsed.data.password, user?.password_hash ?? (await timingDummyHash()));
  if (!user || !ok || !user.is_active) {
    if (user) await recordFailedLogin(user.id);
    return { ok: false, error: 'invalid' };
  }
  await clearFailedLogins(user.id);
  await createSession(user.id, user.role);
  redirect(safeNext(form.get('next'), user.role === 'admin' ? '/admin' : '/account'));
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

export async function updateProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'loginFirst' };
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
  const d = parsed.data;
  try {
    await sql(
      `update public.users set name = $2, email = nullif($3, ''), business_name = nullif($4, ''), gstin = nullif($5, ''), city = nullif($6, '') where id = $1`,
      [user.id, d.name, d.email.toLowerCase(), d.business, d.gstin, d.city],
    );
  } catch (err) {
    if (isUnique(err, 'email')) return { ok: false, error: 'emailTaken' };
    throw err;
  }
  return { ok: true };
}

export async function changePasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'loginFirst' };
  if (!rateLimit(await actionKey('password'), 6, 10 * 60_000)) return { ok: false, error: 'rateLimited' };
  const parsed = passwordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
  const [row] = await sql<{ password_hash: string }>('select password_hash from public.users where id = $1', [user.id]);
  if (!row || !(await verifyPassword(parsed.data.current, row.password_hash))) return { ok: false, error: 'wrongPassword' };
  await sql('update public.users set password_hash = $2 where id = $1', [user.id, await hashPassword(parsed.data.password)]);
  // sign out every other device
  await sql('delete from public.sessions where user_id = $1', [user.id]);
  await createSession(user.id, user.role);
  return { ok: true };
}
