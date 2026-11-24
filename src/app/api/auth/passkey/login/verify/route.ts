import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/audit";
import { fail, json, route } from "@/lib/http";
import { createSession } from "@/lib/session";
import { consumeChallenge, relyingParty } from "@/lib/webauthn";

const schema = z.object({ response: z.object({ id: z.string() }).passthrough() });

export const POST = route("passkey-login-verify", { limit: 30 }, async (req) => {
  const { response } = schema.parse(await req.json());
  const stored = await consumeChallenge("login");
  if (!stored) return fail("Sign-in timed out. Please try again.", 400);

  const passkey = await db.passkey.findUnique({ where: { id: response.id }, include: { user: true } });
  if (!passkey || !passkey.user.verifiedAt) {
    return fail("This passkey isn't registered. Sign in with a code, then set up Face ID again.", 404);
  }

  const { rpID, origin } = relyingParty(req);
  const verification = await verifyAuthenticationResponse({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: response as any,
    expectedChallenge: stored.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: passkey.id,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: passkey.counter,
      transports: passkey.transports?.split(",") as AuthenticatorTransportFuture[] | undefined,
    },
  });
  if (!verification.verified) return fail("Biometric verification failed.", 401);

  // Signature counter guards against cloned authenticators.
  await db.passkey.update({
    where: { id: passkey.id },
    data: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() },
  });

  const { displacedDevice } = await createSession(passkey.userId, req, "PASSKEY");
  await logEvent(passkey.userId, "LOGIN_PASSKEY", req, passkey.nickname);
  return json({ ok: true, displacedDevice });
});
