import 'server-only';
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { signJWT, verifyJWT } from '@/lib/jwt';
import { sql } from './db';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>;

export const SESSION_COOKIE = 'pe_session';
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1 };

/** After this many wrong passwords in a row, the account is locked for LOCK_MINUTES. */
const MAX_FAILED_LOGINS = 6;
const LOCK_MINUTES = 15;

export type Role = 'customer' | 'admin';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  business_name: string | null;
  gstin: string | null;
  city: string | null;
  role: Role;
}

// ─── passwords ────────────────────────────────────────────────────────────────

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, n, r, p, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, { N: +n, r: +r, p: +p });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A hash to compare against when the phone is unknown, so response time doesn't reveal which numbers have accounts. */
let dummyHash: Promise<string> | null = null;
export const timingDummyHash = () => (dummyHash ??= hashPassword(randomBytes(12).toString('hex')));

// ─── account lockout ─────────────────────────────────────────────────────────
// A password guesser gets 6 tries per account before a 15-minute lock, on top of
// the per-IP rate limit in lib/rateLimit.ts — one blocks a botnet, the other
// blocks someone who only needs to try one account from many IPs.

export interface LoginGuard {
  failed_logins: number;
  locked_until: string | null;
}

export function isLocked(guard: Pick<LoginGuard, 'locked_until'>) {
  return !!guard.locked_until && new Date(guard.locked_until) > new Date();
}

export async function recordFailedLogin(userId: string) {
  await sql(
    `update public.users set
       failed_logins = failed_logins + 1,
       locked_until = case when failed_logins + 1 >= $2 then now() + ($3 || ' minutes')::interval else locked_until end
     where id = $1`,
    [userId, MAX_FAILED_LOGINS, LOCK_MINUTES],
  );
}

export async function clearFailedLogins(userId: string) {
  await sql('update public.users set failed_logins = 0, locked_until = null where id = $1', [userId]);
}

// ─── the JWT that signs the session cookie ─────────────────────────────────────
// Who is an admin lives only in the database (public.users.role): there is no
// env-var promotion. Make the first admin by opening the Supabase Table Editor
// and setting that row's role to 'admin'; every admin after that can be made
// from /admin/customers.
//
// The cookie's value is a signed HS256 JWT (see lib/jwt.ts): {sub: userId, sid,
// role, exp}. Its signature is checked on every request, so a tampered or expired
// cookie is rejected before touching the database. Revocation (log out, a
// password change, disabling a user) still lives in `public.sessions`, keyed by
// a hash of `sid` — a JWT alone can't be revoked before it expires, so every real
// authorization check below re-reads that table and never trusts the JWT's own
// `role` claim for the decision, only the database's.

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is not set (or is under 32 characters). Generate one with `openssl rand -base64 32` and add it to the environment.');
  }
  return 'dev-only-insecure-session-secret-do-not-use-in-production';
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function createSession(userId: string, role: Role) {
  const sid = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await sql('insert into public.sessions (token_hash, user_id, expires_at) values ($1, $2, $3)', [sha256(sid), userId, expires]);
  // opportunistic cleanup
  await sql('delete from public.sessions where expires_at < now()');
  const jwt = await signJWT({ sub: userId, sid, role }, sessionSecret(), SESSION_DAYS * 86_400);
  (await cookies()).set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function destroySession() {
  const store = await cookies();
  const jwt = store.get(SESSION_COOKIE)?.value;
  if (jwt) {
    const payload = await verifyJWT(jwt, sessionSecret());
    if (payload) await sql('delete from public.sessions where token_hash = $1', [sha256(payload.sid)]);
  }
  store.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jwt = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!jwt || !process.env.DATABASE_URL) return null;
  const payload = await verifyJWT(jwt, sessionSecret());
  if (!payload) return null; // tampered or expired: rejected without a database round trip
  try {
    const rows = await sql<SessionUser>(
      `select u.id, u.name, u.phone, u.email, u.business_name, u.gstin, u.city, u.role
         from public.sessions s join public.users u on u.id = s.user_id
        where s.token_hash = $1 and s.user_id = $2 and s.expires_at > now() and u.is_active`,
      [sha256(payload.sid), payload.sub],
    );
    return rows[0] ?? null;
  } catch (err) {
    console.error('[auth] session lookup failed', err);
    return null;
  }
});

export async function requireUser(next = '/account') {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser('/admin');
  if (user.role !== 'admin') redirect('/account');
  return user;
}
