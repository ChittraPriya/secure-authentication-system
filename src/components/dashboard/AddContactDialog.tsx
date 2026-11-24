"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { OtpInput } from "@/components/OtpInput";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

type Meta = { sentTo: string; resendInSec: number; devCode?: string };

/** Adds a second, OTP-verified contact method (email or phone). */
export function AddContactDialog({ open, onClose, channel }: { open: boolean; onClose: () => void; channel: "email" | "phone" }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (open) { setStep("enter"); setValue(channel === "phone" ? "+91 " : ""); setCode(""); setError(""); setMeta(null); }
  }, [open, channel]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const noun = channel === "email" ? "email" : "phone number";

  async function request() {
    setBusy(true); setError("");
    const r = await api<Meta>("/api/profile/contact/request", { channel, identifier: value });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setMeta(r); setResendIn(r.resendInSec); setStep("code"); setCode("");
  }

  async function verify(c = code) {
    if (c.length !== 6 || busy) return;
    setBusy(true); setError("");
    const r = await api("/api/profile/contact/verify", { channel, identifier: value, code: c });
    setBusy(false);
    if (!r.ok) { setError(r.error); setCode(""); setAttempt((a) => a + 1); return; }
    toast({ tone: "success", title: `${channel === "email" ? "Email" : "Phone"} verified`, description: "You can now receive sign-in codes there too." });
    onClose();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={channel === "email" ? "mail" : "phone"}
      title={step === "enter" ? `Add a ${noun}` : "Enter verification code"}
      description={step === "enter"
        ? `We'll send a 6-digit code to confirm it's yours. A second contact also acts as account recovery.`
        : <>We sent a code to <b className="font-medium text-fg">{meta?.sentTo}</b>.</>}
      footer={step === "enter" ? (
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={request} disabled={value.trim().length < 5}>Send code</Button>
        </>
      ) : (
        <>
          <Button onClick={() => setStep("enter")}>Back</Button>
          <Button variant="primary" loading={busy} onClick={() => verify()} disabled={code.length !== 6}>Verify</Button>
        </>
      )}
    >
      {step === "enter" ? (
        <form onSubmit={(e) => { e.preventDefault(); request(); }}>
          <label htmlFor="contact-value" className="label">{channel === "email" ? "Email address" : "Mobile number"}</label>
          <input
            id="contact-value"
            data-autofocus
            className={`input ${error ? "input-error" : ""}`}
            type={channel === "email" ? "email" : "tel"}
            inputMode={channel === "email" ? "email" : "tel"}
            autoComplete={channel === "email" ? "email" : "tel"}
            placeholder={channel === "email" ? "you@example.com" : "+91 98765 43210"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {error && <p className="error-text" role="alert">{error}</p>}
        </form>
      ) : (
        <div className="space-y-4">
          {meta?.devCode && (
            <p className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-[13px] text-warning-text">
              Dev mode — your code is{" "}
              <button type="button" className="font-mono font-semibold tracking-widest underline" onClick={() => { setCode(meta.devCode!); verify(meta.devCode!); }}>{meta.devCode}</button>
            </p>
          )}
          <OtpInput key={attempt} value={code} onChange={setCode} onComplete={verify} disabled={busy} invalid={Boolean(error)} />
          {error && <p className="error-text" role="alert">{error}</p>}
          <div className="flex justify-end">
            <button type="button" onClick={request} disabled={resendIn > 0 || busy} className="text-[13px] font-medium text-accent-text hover:underline disabled:text-fg-subtle disabled:no-underline">
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
