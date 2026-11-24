import { json, route } from "@/lib/http";
import { clearSessionCookie, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Heartbeat polled by the dashboard so a displaced device is signed out within seconds. */
export const GET = route("session-status", { limit: 120 }, async () => {
  const s = await getSession();
  if (s.status === "active") return json({ status: "active" });
  if (s.status === "revoked") {
    await clearSessionCookie();
    return json({ status: "revoked", reason: s.reason, replacedBy: s.replacedBy, at: s.at });
  }
  return json({ status: "none" });
});
