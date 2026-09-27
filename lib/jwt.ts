/**
 * Minimal HS256 JWT sign/verify on the Web Crypto API (`crypto.subtle`), so the
 * same code runs in the Node server actions and in the Edge middleware — no
 * `jsonwebtoken` dependency, and no Node-only APIs that Edge can't run.
 *
 * The session cookie's *value* is this JWT. Its signature makes a tampered or
 * expired cookie rejected instantly, without a database round trip. Session
 * *revocation* (log out, password change, disabling a user) still lives in
 * `public.sessions` — a JWT alone can never be revoked before it expires, so
 * every real authorization decision re-checks that table (see lib/server/auth.ts).
 * This file only proves "this token was minted by us and hasn't expired".
 */

export interface JWTPayload {
  /** Subject: the user id. */
  sub: string;
  /** The session id, hashed and looked up in `public.sessions` to confirm it's still valid. */
  sid: string;
  /** Carried for the Edge middleware's coarse gate only — never trusted for an actual authorization decision. */
  role: 'customer' | 'admin';
  iat: number;
  exp: number;
}

const te = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(s.length + ((4 - (s.length % 4)) % 4), '=');
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

const keyCache = new Map<string, Promise<CryptoKey>>();
function keyFor(secret: string) {
  let p = keyCache.get(secret);
  if (!p) {
    p = crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    keyCache.set(secret, p);
  }
  return p;
}

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInSeconds: number): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const full: JWTPayload = { ...payload, iat, exp: iat + expiresInSeconds };
  const header = toB64Url(te.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = toB64Url(te.encode(JSON.stringify(full)));
  const signingInput = `${header}.${body}`;
  const sig = await crypto.subtle.sign('HMAC', await keyFor(secret), te.encode(signingInput));
  return `${signingInput}.${toB64Url(new Uint8Array(sig))}`;
}

/** Verifies the signature and expiry. Returns the payload, or null if either check fails. */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  try {
    const ok = await crypto.subtle.verify('HMAC', await keyFor(secret), fromB64Url(sig) as BufferSource, te.encode(`${header}.${body}`));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64Url(body))) as JWTPayload;
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.sid || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}
