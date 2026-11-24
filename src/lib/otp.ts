import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export const OTP_TTL_MS = 5 * 60 * 1000; // code valid for 5 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses before the code is burned
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // min gap between sends
export const OTP_MAX_PER_HOUR = 5; // sends per identifier per hour

export type OtpPurpose = "SIGNUP" | "LOGIN" | "CONTACT";

function pepper() {
  const p = process.env.OTP_PEPPER;
  if (!p || p.length < 16) throw new Error("OTP_PEPPER is not configured");
  return p;
}

/** Cryptographically secure, uniformly distributed 6-digit code (leading zeros allowed). */
export function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** HMAC binds the code to identifier + purpose, so a stolen DB row can't be replayed elsewhere. */
export function hashCode(code: string, identifier: string, purpose: OtpPurpose) {
  return createHmac("sha256", pepper()).update(`${purpose}:${identifier}:${code}`).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export class OtpError extends Error {
  constructor(message: string, public status = 400, public retryAfter?: number) {
    super(message);
  }
}

/** Issues a new code, enforcing cooldown and hourly limits. Older unused codes are invalidated. */
export async function issueOtp(identifier: string, purpose: OtpPurpose, ip?: string | null) {
  const now = Date.now();
  const recent = await db.otpCode.findMany({
    where: { identifier, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent[0] && now - recent[0].createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - recent[0].createdAt.getTime())) / 1000);
    throw new OtpError(`Please wait ${wait}s before requesting another code.`, 429, wait);
  }
  if (recent.length >= OTP_MAX_PER_HOUR) {
    throw new OtpError("Too many codes requested. Try again in an hour.", 429, 3600);
  }

  const code = generateCode();
  await db.$transaction([
    db.otpCode.updateMany({
      where: { identifier, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    db.otpCode.create({
      data: {
        identifier,
        purpose,
        ip: ip ?? null,
        codeHash: hashCode(code, identifier, purpose),
        expiresAt: new Date(now + OTP_TTL_MS),
      },
    }),
  ]);
  return { code, expiresInSec: OTP_TTL_MS / 1000, resendInSec: OTP_RESEND_COOLDOWN_MS / 1000 };
}

/** Verifies a code. Each wrong attempt is counted; the code is single-use. */
export async function verifyOtp(identifier: string, purpose: OtpPurpose, code: string) {
  const row = await db.otpCode.findFirst({
    where: { identifier, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    throw new OtpError("This code has expired. Request a new one.", 400);
  }
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    throw new OtpError("Too many incorrect attempts. Request a new code.", 429);
  }

  const ok = safeEqualHex(row.codeHash, hashCode(code, identifier, purpose));
  if (!ok) {
    const updated = await db.otpCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 }, ...(row.attempts + 1 >= OTP_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}) },
    });
    const left = OTP_MAX_ATTEMPTS - updated.attempts;
    throw new OtpError(left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Request a new code.", 400);
  }

  // Atomic consume: guards against two parallel requests using the same code.
  const consumed = await db.otpCode.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) throw new OtpError("This code was already used.", 400);
}
