import { z } from "zod";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/audit";
import { fail, json, route } from "@/lib/http";
import { requireSession } from "@/lib/session";

const renameSchema = z.object({ nickname: z.string().trim().min(1, "Give it a name").max(40, "Keep it under 40 characters") });

export const PATCH = route("passkey-rename", { limit: 30 }, async (req, { params }) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);
  const { id } = await params;
  const { nickname } = renameSchema.parse(await req.json());

  const passkey = await db.passkey.findFirst({ where: { id, userId: session.userId } });
  if (!passkey) return fail("Passkey not found", 404);

  await db.passkey.update({ where: { id: passkey.id }, data: { nickname } });
  await logEvent(session.userId, "PASSKEY_RENAMED", req, `${passkey.nickname} → ${nickname}`);
  return json({ ok: true });
});

export const DELETE = route("passkey-delete", { limit: 20 }, async (req, { params }) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);
  const { id } = await params;

  const passkey = await db.passkey.findFirst({ where: { id, userId: session.userId } });
  if (!passkey) return fail("Passkey not found", 404);

  await db.passkey.delete({ where: { id: passkey.id } });
  await logEvent(session.userId, "PASSKEY_REMOVED", req, passkey.nickname);
  return json({ ok: true });
});
