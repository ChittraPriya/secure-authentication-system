import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/audit";
import { describeDevice } from "@/lib/device";
import { fail, json, route } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { consumeChallenge, relyingParty } from "@/lib/webauthn";

const schema = z.object({ response: z.any(), nickname: z.string().trim().max(40).optional() });

export const POST = route("passkey-reg-verify", { limit: 20 }, async (req) => {
  const session = await requireSession();
  if (!session) return fail("Please sign in first", 401);

  const { response, nickname } = schema.parse(await req.json());
  const stored = await consumeChallenge("register");
  if (!stored || stored.userId !== session.userId) return fail("Setup timed out. Please try again.", 400);

  const { rpID, origin } = relyingParty(req);
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: stored.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
  if (!verification.verified || !verification.registrationInfo) return fail("Biometric setup could not be verified.", 400);

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const label = nickname || describeDevice(req.headers.get("user-agent"));

  await db.passkey.create({
    data: {
      id: credential.id,
      userId: session.userId,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports?.join(","),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      nickname: label,
    },
  });
  await logEvent(session.userId, "PASSKEY_ADDED", req, label);
  return json({ ok: true });
});
