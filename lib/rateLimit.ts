import 'server-only';

/**
 * Best-effort in-memory rate limiter (per server instance). Good enough to
 * blunt accidental double-submits and casual abuse; use a shared store such
 * as Upstash/Redis if you run several instances.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length <= limit;
}

export function clientKey(req: Request, scope: string) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
  return `${scope}:${ip}`;
}
