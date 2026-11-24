"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { IdentifierField, type Channel } from "@/components/IdentifierField";
import { OtpStep, type OtpMeta } from "@/components/OtpStep";
import { PasskeyRegisterButton } from "@/components/PasskeyButtons";
import { FaceIdIcon, Spinner } from "@/components/icons";
import { api } from "@/lib/client";

type Step = "details" | "otp" | "biometric";
type Errors = Partial<Record<"firstName" | "surname" | "dob" | "identifier" | "form", string>>;

const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().slice(0, 10);
})();

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [dob, setDob] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [identifier, setIdentifier] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState<OtpMeta | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const r = await api<OtpMeta>("/api/auth/signup", { firstName, surname, dob, channel, identifier });
    setBusy(false);
    if (r.ok) {
      setMeta(r);
      setStep("otp");
    } else {
      const field = (r.field?.split(".").pop() ?? "form") as keyof Errors;
      setErrors({ [field in { firstName: 1, surname: 1, dob: 1, identifier: 1 } ? field : "form"]: r.error });
    }
  }

  if (step === "otp" && meta) {
    return (
      <AuthShell title="Verify it's you" subtitle="Enter the code to activate your account.">
        <OtpStep
          purpose="SIGNUP"
          channel={channel}
          identifier={identifier}
          meta={meta}
          onMeta={setMeta}
          onBack={() => setStep("details")}
          onVerified={() => setStep("biometric")}
        />
      </AuthShell>
    );
  }

  if (step === "biometric") {
    return (
      <AuthShell title={`Welcome, ${firstName}!`} subtitle="Your account is verified. Want faster sign-ins?">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 ring-1 ring-indigo-400/30">
            <FaceIdIcon className="h-10 w-10" />
          </div>
          <p className="text-sm text-slate-600">
            Use Face ID, Touch ID, Windows Hello or your fingerprint next time — no code needed. Your biometric data never leaves your device.
          </p>
          <PasskeyRegisterButton onDone={() => router.replace("/dashboard?welcome=1")} />
          <button className="btn-secondary w-full" onClick={() => router.replace("/dashboard?welcome=1")}>Maybe later</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={<>Already have one? <Link href="/login" className="font-medium text-indigo-600 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="label">First name</label>
            <input id="firstName" className={`input ${errors.firstName ? "input-error" : ""}`} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            {errors.firstName && <p className="error-text">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="surname" className="label">Surname</label>
            <input id="surname" className={`input ${errors.surname ? "input-error" : ""}`} autoComplete="family-name" value={surname} onChange={(e) => setSurname(e.target.value)} required />
            {errors.surname && <p className="error-text">{errors.surname}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="dob" className="label">Date of birth</label>
          <input id="dob" type="date" max={maxDob} min="1900-01-01" className={`input ${errors.dob ? "input-error" : ""}`} autoComplete="bday" value={dob} onChange={(e) => setDob(e.target.value)} required />
          {errors.dob ? <p className="error-text">{errors.dob}</p> : <p className="mt-1.5 text-xs text-slate-500">You must be 13 or older.</p>}
        </div>

        <IdentifierField channel={channel} onChannel={setChannel} value={identifier} onChange={setIdentifier} error={errors.identifier} disabled={busy} />

        {errors.form && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600" role="alert">
            {errors.form} {errors.form.includes("Sign in") && <Link href="/login" className="font-semibold underline">Go to sign in</Link>}
          </p>
        )}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <><Spinner /> Sending code…</> : "Continue"}
        </button>
        <p className="text-center text-xs text-slate-500">We&apos;ll send a 6-digit code to verify it&apos;s really you.</p>
      </form>
    </AuthShell>
  );
}
