import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/audit";
import { fail, json, route } from "@/lib/http";
import { verifyOtp } from "@/lib/otp";
import { requireSession } from "@/lib/session";
import { contactVerifySchema, maskIdentifier } from "@/lib/validation";

/** Step 2: verify the code, then attach the contact to the signed-in account. */
export const POST = route("contact-verify", { limit: 20 }, async (req) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);
  const { channel, identifier, code } = contactVerifySchema.parse(await req.json());

  await verifyOtp(identifier, "CONTACT", code);
  try {
    await db.user.update({ where: { id: session.userId }, data: channel === "email" ? { email: identifier } : { phone: identifier } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail("This contact is already linked to another account.", 409);
    throw e;
  }
  await logEvent(session.userId, "CONTACT_ADDED", req, `${channel === "email" ? "Email" : "Phone"} ${maskIdentifier(identifier)}`);
  return json({ ok: true });
});
