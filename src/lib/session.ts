import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { describeDevice } from "./device";
import { logEvent } from "./audit";

const SESSION_COOKIE = "ok_session";
const DEVICE_COOKIE = "ok_device";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LAST_SEEN_THROTTLE_MS = 60 * 1000;

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Stable random per-browser ID, so we can tell "same device signing in again" from "new device". */
async function getOrSetDeviceId() {
  const jar = await cookies();
  let id = jar.get(DEVICE_COOKIE)?.value;
  if (!id || !/^[a-f0-9]{32}$/.test(id)) {
    id = randomBytes(16).toString("hex");
    jar.set(DEVICE_COOKIE, id, { ...cookieBase, maxAge: 60 * 60 * 24 * 365 * 2 });
  }
  return id;
}

/**
 * SINGLE ACTIVE DEVICE: creating a session revokes every other live session for the user
 * in the same transaction. The old device finds out on its next request / heartbeat.
 */
export async function createSession(userId: string, req: Request, method: "OTP" | "PASSKEY") {
  const deviceId = await getOrSetDeviceId();
  const userAgent = req.headers.get("user-agent");
  const deviceLabel = describeDevice(userAgent);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;

  const { session, displaced } = await db.$transaction(async (tx) => {
    const active = await tx.session.findMany({ where: { userId, revokedAt: null } });
    if (active.length) {
      await tx.session.updateMany({
        where: { id: { in: active.map((s) => s.id) } },
        data: { revokedAt: new Date(), revokedReason: "SIGNED_IN_ELSEWHERE", replacedBy: deviceLabel },
      });
    }
    const session = await tx.session.create({
      data: { userId, deviceId, deviceLabel, method, ip, userAgent, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    const displaced = active.filter((s) => s.deviceId !== deviceId && s.expiresAt > new Date());
    return { session, displaced };
  });

  if (displaced.length) {
    await logEvent(userId, "DEVICE_REPLACED", req, `Signed out ${displaced.map((d) => d.deviceLabel).join(", ")}`);
  }

  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime(session.expiresAt)
    .sign(key());

  (await cookies()).set(SESSION_COOKIE, token, { ...cookieBase, expires: session.expiresAt });
  return { session, displacedDevice: displaced[0]?.deviceLabel ?? null };
}

export type SessionState =
  | { status: "none" }
  | { status: "revoked"; reason: string | null; replacedBy: string | null; at: Date | null }
  | { status: "active"; session: NonNullable<Awaited<ReturnType<typeof loadSession>>> };

function loadSession(id: string) {
  return db.session.findUnique({
    where: { id },
    include: { user: { select: { id: true, firstName: true, surname: true, dob: true, email: true, phone: true, createdAt: true } } },
  });
}

/** Validates the JWT *and* the DB row — a valid signature alone is not enough after a takeover. */
export async function getSession(): Promise<SessionState> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { status: "none" };
  let sid: string | undefined;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    sid = payload.sub;
  } catch {
    return { status: "none" };
  }
  if (!sid) return { status: "none" };

  const session = await loadSession(sid);
  if (!session) return { status: "none" };
  if (session.revokedAt) {
    return { status: "revoked", reason: session.revokedReason, replacedBy: session.replacedBy, at: session.revokedAt };
  }
  if (session.expiresAt < new Date()) return { status: "none" };

  if (Date.now() - session.lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return { status: "active", session };
}

export async function requireSession() {
  const s = await getSession();
  if (s.status !== "active") return null;
  return s.session;
}

export async function destroySession(reason = "LOGOUT") {
  const s = await getSession();
  if (s.status === "active") {
    await db.session.update({ where: { id: s.session.id }, data: { revokedAt: new Date(), revokedReason: reason } });
  }
  (await cookies()).delete(SESSION_COOKIE);
  return s.status === "active" ? s.session.userId : null;
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
