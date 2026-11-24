import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeliveryError } from "./delivery";
import { OtpError } from "./otp";
import { rateLimit } from "./rate-limit";

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return json({ ok: false, error: message, ...extra }, status, extra?.retryAfter ? { "Retry-After": String(extra.retryAfter) } : undefined);
}

/** Rejects cross-site POSTs (CSRF defence in depth alongside SameSite cookies). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

/** Wraps a route: origin check, IP rate limit, and uniform error responses. */
export function route(name: string, opts: { limit: number; windowMs?: number }, handler: Handler): Handler {
  return async (req, ctx) => {
    if (req.method !== "GET" && !sameOrigin(req)) return fail("Cross-origin request blocked", 403);
    const rl = rateLimit(`${name}:${clientIp(req)}`, opts.limit, opts.windowMs ?? 60_000);
    if (!rl.ok) return fail("Too many requests. Slow down.", 429, { retryAfter: rl.retryAfter });
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ZodError) return fail(e.issues[0]?.message ?? "Invalid input", 422, { field: e.issues[0]?.path.join(".") });
      if (e instanceof OtpError) return fail(e.message, e.status, e.retryAfter ? { retryAfter: e.retryAfter } : undefined);
      if (e instanceof DeliveryError) return fail(e.message, 502);
      console.error(`[${name}]`, e);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}
