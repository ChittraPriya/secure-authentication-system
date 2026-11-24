import { db } from "@/lib/db";
import { logEvent } from "@/lib/audit";
import { fail, json, route } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { profileSchema } from "@/lib/validation";

/** Update first name, surname and date of birth. Contact methods change via OTP-verified routes. */
export const PATCH = route("profile-update", { limit: 20 }, async (req) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);
  const data = profileSchema.parse(await req.json());

  const before = session.user;
  const changed = [
    before.firstName !== data.firstName && "first name",
    before.surname !== data.surname && "surname",
    before.dob.getTime() !== data.dob.getTime() && "date of birth",
  ].filter(Boolean) as string[];
  if (!changed.length) return json({ ok: true, changed: [] });

  await db.user.update({ where: { id: session.userId }, data });
  await logEvent(session.userId, "PROFILE_UPDATED", req, `Changed ${changed.join(", ")}`);
  return json({ ok: true, changed });
});
