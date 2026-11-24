import { z } from "zod";
import { db } from "@/lib/db";
import { fail, json, route } from "@/lib/http";
import { clearSessionCookie, requireSession } from "@/lib/session";

const schema = z.object({ confirm: z.literal("DELETE", { errorMap: () => ({ message: 'Type "DELETE" to confirm' }) }) });

/** Permanently deletes the account; sessions, passkeys and audit events cascade. */
export const DELETE = route("account-delete", { limit: 5 }, async (req) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);
  schema.parse(await req.json());

  const identifiers = [session.user.email, session.user.phone].filter(Boolean) as string[];
  await db.$transaction([
    db.otpCode.deleteMany({ where: { identifier: { in: identifiers } } }),
    db.user.delete({ where: { id: session.userId } }),
  ]);
  await clearSessionCookie();
  return json({ ok: true });
});
