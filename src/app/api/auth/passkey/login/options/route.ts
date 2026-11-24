import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { json, route } from "@/lib/http";
import { relyingParty, storeChallenge } from "@/lib/webauthn";

/**
 * Usernameless (discoverable-credential) login: the browser shows the user's passkeys for this
 * site and unlocks one with Face ID / fingerprint / Windows Hello. No identifier is sent, so the
 * endpoint reveals nothing about which accounts exist.
 */
export const POST = route("passkey-login-options", { limit: 30 }, async (req) => {
  const { rpID } = relyingParty(req);
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  await storeChallenge(options.challenge, "login");
  return json(options);
});
