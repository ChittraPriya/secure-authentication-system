import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/AuthShell";
import { DeviceIcon, FaceIdIcon, ShieldIcon } from "@/components/icons";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const features = [
  { icon: ShieldIcon, title: "6-digit one-time codes", body: "Email or SMS. HMAC-hashed, 5-minute expiry, 5 attempts, resend cooldown, rate limited." },
  { icon: FaceIdIcon, title: "Face ID & biometrics", body: "WebAuthn passkeys: Face ID, Touch ID, Windows Hello, Android fingerprint. Phishing-proof." },
  { icon: DeviceIcon, title: "One active device", body: "A new sign-in revokes the old session server-side; the old device is told within seconds." },
];

export default async function Home() {
  if ((await getSession()).status === "active") redirect("/dashboard");

  return (
    <div className="auth-bg"><main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/login" className="btn-secondary">Sign in</Link>
      </header>

      <section className="my-auto py-16 text-center animate-fadeUp">
        <span className="chip">Passwordless · Biometric · Single-device</span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Your account, <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">one key</span>, one device.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-slate-600">
          Sign up with your email or phone. Sign in with a 6-digit code or just your face. No passwords, ever.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">Create account</Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base"><FaceIdIcon /> Sign in with Face ID</Link>
        </div>
      </section>

      <section className="grid gap-4 pb-8 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <Icon className="h-6 w-6 text-indigo-600" />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </section>
    </main></div>
  );
}
