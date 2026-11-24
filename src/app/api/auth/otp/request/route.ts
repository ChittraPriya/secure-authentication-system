import { db } from "@/lib/db";
import { sendOtp } from "@/lib/delivery";
import { clientIp, json, route } from "@/lib/http";
import { issueOtp, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from "@/lib/otp";
import { maskIdentifier, otpRequestSchema as schema } from "@/lib/validation";

/**
 * Sends a login code (or re-sends a sign-up code).
 * The response is identical whether or not the account exists → no user enumeration.
 */
export const POST = route("otp-request", { limit: 10 }, async (req) => {
  const { purpose, channel, identifier } = schema.parse(await req.json());
  const user = await db.user.findUnique({ where: channel === "email" ? { email: identifier } : { phone: identifier } });
  const eligible = purpose === "LOGIN" ? Boolean(user?.verifiedAt) : Boolean(user && !user.verifiedAt);

  let devCode: string | undefined;
  if (eligible) {
    const otp = await issueOtp(identifier, purpose, clientIp(req));
    devCode = (await sendOtp(channel, identifier, otp.code, purpose)).devCode;
  }

  return json({
    ok: true,
    sentTo: maskIdentifier(identifier),
    expiresInSec: OTP_TTL_MS / 1000,
    resendInSec: OTP_RESEND_COOLDOWN_MS / 1000,
    devCode,
  });
});
