import { logEvent } from "@/lib/audit";
import { json, route } from "@/lib/http";
import { destroySession } from "@/lib/session";

export const POST = route("logout", { limit: 30 }, async (req) => {
  const userId = await destroySession("LOGOUT");
  if (userId) await logEvent(userId, "LOGOUT", req);
  return json({ ok: true });
});
