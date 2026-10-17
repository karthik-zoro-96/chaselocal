import { NextResponse } from 'next/server';

const WINDOW_MS = 10 * 60_000;
const LIMIT = 30;

// In-memory, so limits are per server instance rather than global.
const hits = new Map<string, { count: number; resetAt: number }>();

// Vercel overwrites these with the real client IP, so they can't be spoofed there.
function clientIp(req: Request) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'local'
  );
}

export function rateLimit(req: Request) {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.resetAt <= now) {
    if (hits.size > 10_000) {
      for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
    }
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (entry.count >= LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  entry.count++;
  return null;
}
