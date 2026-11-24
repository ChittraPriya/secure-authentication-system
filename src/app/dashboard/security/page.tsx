import type { Metadata } from "next";
import { SecurityChecklist } from "@/components/dashboard/SecurityChecklist";
import { PageHeader } from "@/components/dashboard/widgets";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ScoreRing } from "@/components/ui/misc";
import { getPasskeys, requireDashboardSession } from "@/lib/dashboard";
import { securityChecklist } from "@/lib/security";

export const metadata: Metadata = { title: "Security" };

const protections: { icon: IconName; title: string; body: string }[] = [
  { icon: "key", title: "Passwordless by design", body: "There's no password to phish, reuse or leak. You prove it's you with a one-time code or a passkey." },
  { icon: "lock", title: "Hardened one-time codes", body: "Codes are HMAC-hashed, expire in 5 minutes, work once, and lock after 5 wrong attempts." },
  { icon: "fingerprint", title: "Phishing-resistant passkeys", body: "WebAuthn credentials are bound to this site. Your biometric never leaves your device." },
  { icon: "devices", title: "One active device", body: "Signing in elsewhere revokes this session server-side, and the old device is told within seconds." },
];

export default async function SecurityPage() {
  const session = await requireDashboardSession();
  const passkeys = await getPasskeys(session.userId);
  const items = securityChecklist({ email: session.user.email, phone: session.user.phone, passkeyCount: passkeys.length });
  const done = items.filter((i) => i.done).length;
  const remaining = items.filter((i) => !i.done);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Security" title="Account protection" description="See how your account is protected and finish any recommended steps." />

      <Card className="relative overflow-hidden">
        <div aria-hidden className="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl animate-aurora" />
        <div className="relative flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
          <ScoreRing value={done} total={items.length} size={120} label={`${done} of ${items.length} security steps complete`} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-fg">
              {remaining.length === 0 ? "Your account is fully protected" : `${remaining.length} step${remaining.length === 1 ? "" : "s"} to full protection`}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-fg-muted">
              {remaining.length === 0
                ? "Passkeys, verified contacts and single-device sessions are all active."
                : `Recommended next: ${remaining.map((r) => r.title.toLowerCase()).join(", ")}.`}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Security checklist" description="Status is based on your account. Nothing here is a placeholder." icon="shieldCheck" />
        <CardBody><SecurityChecklist items={items} /></CardBody>
      </Card>

      <Card>
        <CardHeader title="How your account is protected" description="Built-in safeguards that are always on" icon="lock" />
        <CardBody>
          <ul className="stagger grid gap-3 sm:grid-cols-2">
            {protections.map((p) => (
              <li key={p.title} className="spotlight lift flex gap-3 rounded-xl border border-line bg-surface p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-text"><Icon name={p.icon} className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-medium text-fg">{p.title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-fg-muted">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
