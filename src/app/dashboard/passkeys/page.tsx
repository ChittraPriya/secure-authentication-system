import type { Metadata } from "next";
import { RegisterPasskeyButton } from "@/components/dashboard/actions";
import { PageHeader } from "@/components/dashboard/widgets";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { getPasskeys, requireDashboardSession } from "@/lib/dashboard";
import { PasskeyManager } from "./PasskeyManager";

export const metadata: Metadata = { title: "Passkeys" };

const how: { icon: IconName; title: string; body: string }[] = [
  { icon: "faceId", title: "Unlock with your face or finger", body: "Your device checks your biometric locally — it is never sent to us." },
  { icon: "key", title: "Device signs a challenge", body: "A private key on your device signs a one-time challenge from the server." },
  { icon: "shieldCheck", title: "We verify the signature", body: "We only store the public key. Fake sites can't use it — it's bound to this domain." },
];

export default async function PasskeysPage() {
  const session = await requireDashboardSession();
  const passkeys = await getPasskeys(session.userId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Biometrics"
        title="Passkeys"
        description="Sign in with Face ID, Touch ID, Windows Hello, Android fingerprint or a security key — no code needed."
        actions={<RegisterPasskeyButton label={passkeys.length ? "Add passkey" : "Set up passkey"} />}
      />

      <Card>
        <CardHeader title="Registered passkeys" description={passkeys.length ? `${passkeys.length} active · you can register one per device` : "No passkeys yet"} icon="fingerprint" />
        <CardBody>
          <PasskeyManager
            passkeys={passkeys.map((p) => ({
              id: p.id,
              nickname: p.nickname,
              synced: p.backedUp,
              deviceType: p.deviceType,
              createdAt: p.createdAt.toISOString(),
              lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
            }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="How passkeys work" description="Why they're safer than passwords and codes" icon="info" />
        <CardBody>
          <ol className="stagger grid gap-3 md:grid-cols-3">
            {how.map((h, i) => (
              <li key={h.title} className="spotlight relative rounded-xl border border-line bg-surface p-4">
                <span className="absolute right-4 top-4 text-xs font-semibold text-fg-subtle/70">0{i + 1}</span>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent-text"><Icon name={h.icon} className="h-4 w-4" /></span>
                <p className="mt-3 text-sm font-medium text-fg">{h.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-fg-muted">{h.body}</p>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
