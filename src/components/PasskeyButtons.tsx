"use client";

import { useCallback, useEffect, useState } from "react";
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { api, webauthnError } from "@/lib/client";
import { FaceIdIcon, Spinner } from "./icons";

export function useBiometricSupport() {
  const [state, setState] = useState<{ supported: boolean; platform: boolean } | null>(null);
  useEffect(() => {
    const supported = browserSupportsWebAuthn();
    if (!supported) return setState({ supported: false, platform: false });
    platformAuthenticatorIsAvailable().then((platform) => setState({ supported, platform })).catch(() => setState({ supported, platform: false }));
  }, []);
  return state;
}

/** WebAuthn registration flow (options → OS biometric prompt → verify). Shared by sign-up and dashboard. */
export function usePasskeyRegistration() {
  const support = useBiometricSupport();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const register = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    setBusy(true);
    setError("");
    try {
      const opts = await api<Record<string, unknown>>("/api/auth/passkey/register/options", {});
      if (!opts.ok) throw new Error(opts.error);
      const { ok, ...optionsJSON } = opts;
      void ok;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await startRegistration({ optionsJSON: optionsJSON as any });
      const r = await api("/api/auth/passkey/register/verify", { response });
      if (!r.ok) throw new Error(r.error);
      return { ok: true };
    } catch (e) {
      const msg = webauthnError(e);
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setBusy(false);
    }
  }, []);

  return { register, busy, error, support };
}

/** One-tap biometric sign-in (discoverable passkey). */
export function PasskeyLoginButton({ onSuccess }: { onSuccess: (r: { displacedDevice?: string | null }) => void }) {
  const support = useBiometricSupport();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const opts = await api<Record<string, unknown>>("/api/auth/passkey/login/options", {});
      if (!opts.ok) throw new Error(opts.error);
      const { ok, ...optionsJSON } = opts;
      void ok;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await startAuthentication({ optionsJSON: optionsJSON as any });
      const r = await api<{ displacedDevice: string | null }>("/api/auth/passkey/login/verify", { response });
      if (!r.ok) throw new Error(r.error);
      onSuccess(r);
    } catch (e) {
      setError(webauthnError(e));
    } finally {
      setBusy(false);
    }
  }

  if (support && !support.supported) {
    return <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm text-fg-muted">This browser doesn&apos;t support Face ID / passkeys. Use a code below.</p>;
  }

  return (
    <div>
      <button type="button" onClick={signIn} disabled={busy || !support} className="btn-primary w-full py-3 text-base">
        {busy ? <Spinner className="h-5 w-5" /> : <FaceIdIcon />} {busy ? "Waiting for biometrics…" : "Sign in with Face ID / Biometrics"}
      </button>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}

/** Registers the current device's authenticator (Face ID, Touch ID, Windows Hello, fingerprint). */
export function PasskeyRegisterButton({ onDone, className = "btn-primary w-full", label = "Enable Face ID / Biometrics" }: { onDone: () => void; className?: string; label?: string }) {
  const { register, busy, error, support } = usePasskeyRegistration();

  if (support && !support.supported) return <p className="text-sm text-fg-muted">Biometrics aren&apos;t supported in this browser.</p>;

  return (
    <div>
      <button type="button" onClick={async () => { if ((await register()).ok) onDone(); }} disabled={busy || !support} className={className}>
        {busy ? <Spinner /> : <FaceIdIcon />} {busy ? "Follow the prompt on your device…" : label}
      </button>
      {support && !support.platform && <p className="mt-2 text-xs text-fg-subtle">No built-in biometric sensor detected — you can still use your phone or a security key.</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}
