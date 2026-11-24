import { db } from "@/lib/db";
import { logEvent } from "@/lib/audit";
import { fail, json, route } from "@/lib/http";
import { OtpError, verifyOtp } from "@/lib/otp";
import { createSession } from "@/lib/session";
import { otpVerifySchema } from "@/lib/validation";

export const POST = route("otp-verify", { limit: 20 }, async (req) => {
  const { purpose, code, channel, identifier } = otpVerifySchema.parse(await req.json());
  const user = await db.user.findUnique({ where: channel === "email" ? { email: identifier } : { phone: identifier } });

  if (!user || (purpose === "LOGIN" && !user.verifiedAt)) {
    return fail("This code has expired. Request a new one.", 400);
  }

  try {
    await verifyOtp(identifier, purpose, code);
  } catch (e) {
    if (e instanceof OtpError && user.verifiedAt) await logEvent(user.id, "OTP_FAILED", req, e.message);
    throw e;
  }

  const isNew = !user.verifiedAt;
  if (isNew) {
    await db.user.update({ where: { id: user.id }, data: { verifiedAt: new Date() } });
    await logEvent(user.id, "ACCOUNT_CREATED", req);
  }
  const { displacedDevice } = await createSession(user.id, req, "OTP");
  await logEvent(user.id, "LOGIN_OTP", req);

  return json({ ok: true, isNew, displacedDevice });
});
