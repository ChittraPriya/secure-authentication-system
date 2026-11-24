import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const CHALLENGE_COOKIE = "ok_webauthn";

/** Relying-party ID & origin: from env when set, otherwise derived from the request host. */
export function relyingParty(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return {
    rpID: process.env.RP_ID || host.split(":")[0],
    origin: process.env.APP_ORIGIN || `${proto}://${host}`,
    rpName: process.env.RP_NAME || "OneKey",
  };
}

function key() {
  return new TextEncoder().encode(process.env.SESSION_SECRET!);
}

/** Challenges live in a signed, short-lived, httpOnly cookie — stateless and replay-safe (single use). */
export async function storeChallenge(challenge: string, kind: "register" | "login", userId?: string) {
  const token = await new SignJWT({ challenge, kind, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(key());
  (await cookies()).set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/passkey",
    maxAge: 300,
  });
}

export async function consumeChallenge(kind: "register" | "login") {
  const jar = await cookies();
  const token = jar.get(CHALLENGE_COOKIE)?.value;
  jar.delete({ name: CHALLENGE_COOKIE, path: "/api/auth/passkey" });
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.kind !== kind) return null;
    return { challenge: payload.challenge as string, userId: payload.userId as string | undefined };
  } catch {
    return null;
  }
}
