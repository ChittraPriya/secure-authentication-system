import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

/**
 * Auth gate for every /dashboard route (layout + pages share one result per request via React cache).
 * Validates the JWT *and* the DB session row, so a revoked device is bounced to /login.
 */
export const requireDashboardSession = cache(async () => {
  const state = await getSession();
  if (state.status === "revoked") redirect(`/login?replaced=${encodeURIComponent(state.replacedBy ?? "another device")}`);
  if (state.status !== "active") redirect("/login");
  return state.session;
});

export const getPasskeys = cache((userId: string) =>
  db.passkey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
);

export const getEvents = cache((userId: string, take: number) =>
  db.securityEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take }),
);

export const getSessionHistory = cache((userId: string) =>
  db.session.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 25 }),
);
