"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { IdentifierField, type Channel } from "@/components/IdentifierField";
import { OtpStep, type OtpMeta } from "@/components/OtpStep";
import { PasskeyLoginButton } from "@/components/PasskeyButtons";
import { Spinner } from "@/components/icons";
import { api } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const replacedBy = params.get("replaced");
  const [channel, setChannel] = useState<Channel>("email");
  const [identifier, setIdentifier] = useState("");
  const [meta, setMeta] = useState<OtpMeta | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function done(r: { displacedDevice?: string | null }) {
    router.replace(r.displacedDevice ? `/dashboard?displaced=${encodeURIComponent(r.displacedDevice)}` : "/dashboard");
    router.refresh();
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api<OtpMeta>("/api/auth/otp/request", { purpose: "LOGIN", channel, identifier });
    setBusy(false);
    if (r.ok) setMeta(r);
    else setError(r.error);
  }

  if (meta) {
    return (
      <AuthShell
        title="Enter your code"
        subtitle={
          <>
            If an account exists, a code is on its way. No code?{" "}
            <Link href="/signup" className="font-medium text-accent-text hover:underline">Create an account first</Link>
          </>
        }
      >
        <OtpStep purpose="LOGIN" channel={channel} identifier={identifier} meta={meta} onMeta={setMeta} onBack={() => setMeta(null)} onVerified={done} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={<>New here? <Link href="/signup" className="font-medium text-indigo-600 hover:underline">Create an account</Link></>}
    >
      {replacedBy && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-800" role="status">
          <p className="font-semibold">You were signed out</p>
          <p className="mt-0.5 text-amber-700">Your account was signed in on <b>{replacedBy}</b>. Only one device can be active at a time.</p>
        </div>
      )}

      <PasskeyLoginButton onSuccess={done} />

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
        <span className="h-px flex-1 bg-slate-200" /> or get a 6-digit code <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={requestCode} className="space-y-4" noValidate>
        <IdentifierField channel={channel} onChannel={setChannel} value={identifier} onChange={setIdentifier} error={error} disabled={busy} />
        <button className="btn-secondary w-full" disabled={busy || identifier.trim().length < 4}>
          {busy ? <><Spinner /> Sending…</> : "Send code"}
        </button>
      </form>
    </AuthShell>
  );
}
