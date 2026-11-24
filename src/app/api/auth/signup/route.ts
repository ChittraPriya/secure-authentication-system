import { db } from "@/lib/db";
import { sendOtp } from "@/lib/delivery";
import { clientIp, fail, json, route } from "@/lib/http";
import { issueOtp } from "@/lib/otp";
import { maskIdentifier, signupSchema } from "@/lib/validation";

export const POST = route("signup", { limit: 10 }, async (req) => {
  const input = signupSchema.parse(await req.json());
  const where = input.channel === "email" ? { email: input.identifier } : { phone: input.identifier };

  const existing = await db.user.findUnique({ where });
  if (existing?.verifiedAt) {
    return fail("An account with this " + (input.channel === "email" ? "email" : "phone number") + " already exists. Sign in instead.", 409, { code: "ACCOUNT_EXISTS" });
  }

  const profile = { firstName: input.firstName, surname: input.surname, dob: input.dob };
  if (existing) await db.user.update({ where: { id: existing.id }, data: profile });
  else await db.user.create({ data: { ...profile, ...where } });

  const otp = await issueOtp(input.identifier, "SIGNUP", clientIp(req));
  const delivery = await sendOtp(input.channel, input.identifier, otp.code, "SIGNUP");

  return json({
    ok: true,
    sentTo: maskIdentifier(input.identifier),
    expiresInSec: otp.expiresInSec,
    resendInSec: otp.resendInSec,
    devCode: delivery.devCode,
  });
});
