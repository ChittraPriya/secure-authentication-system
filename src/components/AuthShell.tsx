import Link from "next/link";
import { BrandMark, BrandName } from "./BrandMark";
import { DeviceIcon, FaceIdIcon, ShieldIcon } from "./icons";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="OneKey home">
      <BrandMark />
      <BrandName />
    </Link>
  );
}

const points = [
  { icon: ShieldIcon, title: "No passwords to leak", body: "Single-use 6-digit codes, hashed and rate-limited." },
  { icon: FaceIdIcon, title: "Face ID & fingerprint", body: "Phishing-resistant passkeys via WebAuthn." },
  { icon: DeviceIcon, title: "One active device", body: "Signing in elsewhere instantly signs out the old device." },
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="auth-bg"><main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <section className="hidden lg:block">
        <Logo />
        <h2 className="mt-8 text-4xl font-bold leading-tight tracking-tight">
          Sign in the way your phone unlocks — <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">with your face.</span>
        </h2>
        <ul className="mt-10 space-y-5">
          {points.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600"><Icon /></span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-slate-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-md animate-fadeUp">
        <div className="mb-6 lg:hidden"><Logo /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </main></div>
  );
}
