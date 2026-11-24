import { db } from "@/lib/db";
import { sendOtp } from "@/lib/delivery";
import { clientIp, fail, json, route } from "@/lib/http";
import { issueOtp } from "@/lib/otp";
import { requireSession } from "@/lib/session";
import { identifierSchema, maskIdentifier } from "@/lib/validation";

/** Step 1 of adding a second contact method: send a code to prove ownership. */
export const POST = route("contact-request", { limit: 10 }, async (req) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);
  const { channel, identifier } = identifierSchema.parse(await req.json());

  if (channel === "email" ? session.user.email : session.user.phone) {
    return fail(`You already have a verified ${channel === "email" ? "email" : "phone number"}.`, 409);
  }
  const taken = await db.user.findUnique({ where: channel === "email" ? { email: identifier } : { phone: identifier } });
  if (taken) return fail(`This ${channel === "email" ? "email" : "number"} is already linked to another account.`, 409, { field: "identifier" });

  const otp = await issueOtp(identifier, "CONTACT", clientIp(req));
  const delivery = await sendOtp(channel, identifier, otp.code, "CONTACT");
  return json({ ok: true, sentTo: maskIdentifier(identifier), expiresInSec: otp.expiresInSec, resendInSec: otp.resendInSec, devCode: delivery.devCode });
});
