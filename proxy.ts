import { NextResponse, type NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

/**
 * Runs at the edge, before any page renders. Two jobs:
 *
 * 1. A coarse, cheap gate on /admin and /account: reject a missing, expired or
 *    tampered session cookie (and, for /admin, a non-admin role) before the
 *    request ever reaches the database. This is defense-in-depth, not the real
 *    check — `requireUser`/`requireAdmin` in lib/server/auth.ts still re-read
 *    the session and the user's role from the database on every one of these
 *    pages and server actions, because a JWT's claims can't be revoked and are
 *    never trusted alone for an authorization decision.
 * 2. A per-request CSP nonce, so inline scripts (the theme-flash guard, the
 *    JSON-LD block) are allow-listed individually instead of the far weaker
 *    `unsafe-inline`, and Next.js applies the same nonce to its own scripts
 *    automatically when it sees the `x-nonce` request header.
 */

const SESSION_COOKIE = 'pe_session';

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  return 'dev-only-insecure-session-secret-do-not-use-in-production';
}

function cspHeader(nonce: string) {
  const self = "'self'";
  return [
    `default-src ${self}`,
    `script-src ${self} 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src ${self} 'unsafe-inline'`,
    `img-src ${self} data: https:`,
    `font-src ${self} data:`,
    `frame-src https://maps.google.com https://www.google.com`,
    `connect-src ${self}`,
    `frame-ancestors 'none'`,
    `base-uri ${self}`,
    `form-action ${self}`,
    `object-src 'none'`,
    'upgrade-insecure-requests',
  ].join('; ');
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = cspHeader(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const guarded = pathname.startsWith('/admin') || pathname.startsWith('/account');
  if (guarded) {
    const jwt = req.cookies.get(SESSION_COOKIE)?.value;
    const payload = jwt ? await verifyJWT(jwt, sessionSecret()) : null;
    // No session at all: to /login, same as requireUser(). A real session but the
    // wrong role for /admin: to /account, same as requireAdmin() — never to /login,
    // which would send a signed-in visitor right back to /admin (an infinite loop).
    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(pathname)}`;
      const res = NextResponse.redirect(url);
      res.headers.set('Content-Security-Policy', csp);
      return res;
    }
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/account';
      url.search = '';
      const res = NextResponse.redirect(url);
      res.headers.set('Content-Security-Policy', csp);
      return res;
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  matcher: [
    /*
     * Every route except static assets and image optimization, so the nonce and
     * CSP apply everywhere pages render, without wrapping files that don't.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|robots.txt|sitemap.xml).*)',
  ],
};
