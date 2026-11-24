import type { Metadata } from "next";
import { SignOutDeviceButton } from "@/components/dashboard/actions";
import { DeviceCard, PageHeader } from "@/components/dashboard/widgets";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { EmptyState, RelativeTime } from "@/components/ui/misc";
import { getSessionHistory, requireDashboardSession } from "@/lib/dashboard";
import { parseUserAgent } from "@/lib/device";
import { fmtDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Active Devices" };

const steps = [
  { n: 1, title: "You sign in on a new device", body: "With a one-time code or a passkey." },
  { n: 2, title: "Old session is revoked instantly", body: "In the same database transaction that creates the new one." },
  { n: 3, title: "The old device is notified", body: "Its heartbeat sees the revocation within ~5 seconds." },
];

function endState(s: { revokedReason: string | null; replacedBy: string | null; expiresAt: Date }): { label: string; tone: Tone } {
  if (s.revokedReason === "SIGNED_IN_ELSEWHERE") return { label: s.replacedBy ? `Replaced by ${s.replacedBy}` : "Replaced", tone: "warning" };
  if (s.revokedReason === "LOGOUT") return { label: "Signed out", tone: "neutral" };
  if (s.expiresAt < new Date()) return { label: "Expired", tone: "neutral" };
  return { label: "Ended", tone: "neutral" };
}

export default async function DevicesPage() {
  const session = await requireDashboardSession();
  const history = (await getSessionHistory(session.userId)).filter((s) => s.id !== session.id);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sessions" title="Active devices" description="Your account can be signed in on one device at a time. Manage the current session and review past ones." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <DeviceCard
            size="lg"
            session={{
              userAgent: session.userAgent,
              deviceLabel: session.deviceLabel,
              method: session.method,
              ip: session.ip,
              createdAt: session.createdAt.toISOString(),
              lastSeenAt: session.lastSeenAt.toISOString(),
              expiresAt: session.expiresAt.toISOString(),
            }}
            footer={
              <>
                <p className="flex items-center gap-1.5 text-xs text-fg-muted"><Icon name="info" className="h-3.5 w-3.5" /> Location isn&apos;t collected — only the details shown above.</p>
                <SignOutDeviceButton />
              </>
            }
          />
        </Card>

        <Card>
          <CardHeader title="Single-device policy" description="How takeover protection works" icon="shieldCheck" />
          <CardBody>
            <ol className="relative space-y-5">
              <span aria-hidden className="absolute bottom-3 left-[13px] top-3 w-px origin-top animate-draw bg-line" />
              {steps.map((s, i) => (
                <li key={s.n} className="relative flex gap-3 animate-rise" style={{ animationDelay: `${150 + i * 90}ms` }}>
                  <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-white ring-4 ring-surface">{s.n}</span>
                  <div>
                    <p className="text-sm font-medium text-fg">{s.title}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Session history" description="Previous sessions on your account, newest first" icon="clock" />
        <CardBody className="px-0 pb-2 sm:px-0">
          {history.length === 0 ? (
            <EmptyState icon="devices" title="No previous sessions" description="When you sign in on another device or sign out, the ended session will be listed here." />
          ) : (
            <div role="table" aria-label="Session history" className="text-sm">
              <div role="row" className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] gap-4 border-y border-line bg-surface-2/60 px-6 py-2 text-xs font-medium text-fg-subtle md:grid">
                <span role="columnheader">Device</span><span role="columnheader">Method</span><span role="columnheader">Started</span><span role="columnheader">Status</span>
              </div>
              <div className="stagger divide-y divide-line">
                {history.map((s) => {
                  const d = parseUserAgent(s.userAgent);
                  const end = endState(s);
                  const icon: IconName = d.kind === "desktop" ? "monitor" : "smartphone";
                  return (
                    <div key={s.id} role="row" className="grid grid-cols-1 gap-2 px-5 py-3.5 transition-colors hover:bg-surface-2/50 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] md:items-center md:gap-4">
                      <span role="cell" className="flex min-w-0 items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted"><Icon name={icon} className="h-4 w-4" /></span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-fg">{s.deviceLabel}</span>
                          <span className="block text-xs text-fg-subtle md:hidden">{fmtDateTime(s.createdAt)}</span>
                        </span>
                      </span>
                      <span role="cell" className="text-fg-muted max-md:pl-11 max-md:text-xs">{s.method === "PASSKEY" ? "Passkey" : "One-time code"}</span>
                      <span role="cell" className="hidden text-fg-muted md:block" title={fmtDateTime(s.createdAt)}><RelativeTime iso={s.createdAt.toISOString()} /></span>
                      <span role="cell" className="flex min-w-0 flex-wrap items-center gap-2 max-md:pl-11">
                        <Badge tone={end.tone} className="max-w-full truncate">{end.label}</Badge>
                        {s.revokedAt && <span className="text-xs text-fg-subtle">{fmtDateTime(s.revokedAt)}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
