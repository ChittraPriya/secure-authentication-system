"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { OtpInput } from "./OtpInput";
import { Spinner } from "./icons";
import type { Channel } from "./IdentifierField";

export type OtpMeta = { sentTo: string; expiresInSec: number; resendInSec: number; devCode?: string };

export function OtpStep({
  purpose,
  channel,
  identifier,
  meta,
  onMeta,
  onVerified,
  onBack,
}: {
  purpose: "SIGNUP" | "LOGIN";
  channel: Channel;
  identifier: string;
  meta: OtpMeta;
  onMeta: (m: OtpMeta) => void;
  onVerified: (r: { isNew?: boolean; displacedDevice?: string | null }) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(meta.resendInSec);
  const [expiresIn, setExpiresIn] = useState(meta.expiresInSec);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setResendIn(meta.resendInSec);
    setExpiresIn(meta.expiresInSec);
  }, [meta]);

  useEffect(() => {
    const t = setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
      setExpiresIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  async function verify(c = code) {
    if (c.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    const r = await api<{ isNew: boolean; displacedDevice: string | null }>("/api/auth/otp/verify", { purpose, channel, identifier, code: c });
    setBusy(false);
    if (r.ok) return onVerified(r);
    setError(r.error);
    setAttempt((a) => a + 1);
    setCode("");
  }

  async function resend() {
    setError("");
    const r = await api<OtpMeta>("/api/auth/otp/request", { purpose, channel, identifier });
    if (r.ok) { onMeta(r); setCode(""); } else setError(r.error);
  }

  const mm = String(Math.floor(expiresIn / 60)).padStart(1, "0");
  const ss = String(expiresIn % 60).padStart(2, "0");

  return (
    <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-5">
      <p className="text-sm text-slate-600">
        We sent a 6-digit code to <span className="font-medium text-slate-800">{meta.sentTo}</span>.{" "}
        <button type="button" onClick={onBack} className="text-indigo-600 hover:underline">Change</button>
      </p>

      {meta.devCode && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          <span className="font-semibold">Dev mode:</span> no SMTP/SMS configured — your code is{" "}
          <button type="button" className="font-mono font-bold tracking-widest underline" onClick={() => { setCode(meta.devCode!); verify(meta.devCode!); }}>
            {meta.devCode}
          </button>
        </div>
      )}

      <OtpInput key={attempt} value={code} onChange={setCode} onComplete={verify} disabled={busy} invalid={Boolean(error)} />
      <div aria-live="polite">{error && <p className="error-text">{error}</p>}</div>

      <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
        {busy ? <><Spinner /> Verifying…</> : "Verify & continue"}
      </button>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{expiresIn > 0 ? <>Expires in <span className="tabular-nums">{mm}:{ss}</span></> : <span className="text-rose-600">Code expired</span>}</span>
        <button type="button" onClick={resend} disabled={resendIn > 0} className="font-medium text-indigo-600 hover:underline disabled:text-slate-500 disabled:no-underline">
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
