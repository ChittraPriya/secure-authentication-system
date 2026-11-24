import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { fail, json, route } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { relyingParty, storeChallenge } from "@/lib/webauthn";

export const POST = route("passkey-reg-options", { limit: 20 }, async (req) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);
  const { user } = session;
  const { rpID, rpName } = relyingParty(req);

  const existing = await db.passkey.findMany({ where: { userId: user.id }, select: { id: true, transports: true } });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email ?? user.phone ?? user.id,
    userDisplayName: `${user.firstName} ${user.surname}`,
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({
      id: p.id,
      transports: p.transports?.split(",") as AuthenticatorTransportFuture[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "required", // discoverable → one-tap "Sign in with Face ID", no username needed
      userVerification: "required", // forces the biometric / device PIN check
    },
  });

  await storeChallenge(options.challenge, "register", user.id);
  return json(options);
});
