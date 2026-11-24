import type { Metadata } from "next";
import Link from "next/link";
import { RegisterPasskeyButton, WelcomeToasts } from "@/components/dashboard/actions";
import { SecurityChecklist } from "@/components/dashboard/SecurityChecklist";
import { ActivityTimeline, DeviceCard, StatCard } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { CountUp, EmptyState, RelativeTime, ScoreRing } from "@/components/ui/misc";
import { toActivityItem } from "@/lib/activity";
import { getEvents, getPasskeys, getSessionHistory, requireDashboardSession } from "@/lib/dashboard";
import { parseUserAgent } from "@/lib/device";
import { fmtDate, fmtLongDate } from "@/lib/format";
import { securityChecklist } from "@/lib/security";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Overview({ searchParams }: { searchParams: Promise<{ welcome?: string; displaced?: string }> }) {
  const session = await requireDashboardSession();
  const { user } = session;
  const [passkeys, events, history, sp] = await Promise.all([getPasskeys(user.id), getEvents(user.id, 6), getSessionHistory(user.id), searchParams]);

  const previous = history.find((s) => s.id !== session.id) ?? null;
  const device = parseUserAgent(session.userAgent);
  const checklist = securityChecklist({ email: user.email, phone: user.phone, passkeyCount: passkeys.length });
  const done = checklist.filter((c) => c.done).length;
  const activity = events.map(toActivityItem);

  return (
    <div className="space-y-6">
      <WelcomeToasts welcome={sp.welcome === "1"} displaced={sp.displaced} />

      {/* Welcome */}
      <section className="card relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-aurora" />
          <div className="absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl animate-aurora-slow" />
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: "radial-gradient(rgb(var(--fg) / 0.07) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
              maskImage: "linear-gradient(to left, black, transparent 70%)",
              WebkitMaskImage: "linear-gradient(to left, black, transparent 70%)",
            }}
          />
        </div>
        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 animate-rise">
            <p className="flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
              <Icon name="calendar" className="h-3.5 w-3.5" />
              <span suppressHydrationWarning>{fmtLongDate(new Date())}</span>
            </p>
            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
              Welcome back, {user.firstName} {user.surname}
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted">Here&apos;s your account security overview.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
              <Badge tone="success" dot>Account verified</Badge>
              <span className="inline-flex items-start gap-1.5 rounded-lg border border-line bg-surface/70 px-2.5 py-1 backdrop-blur sm:items-center sm:rounded-full sm:py-0.5">
                <Icon name="clock" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-subtle sm:mt-0" />
                <span>
                  {previous ? (
                    <>Previous sign-in <RelativeTime iso={previous.createdAt.toISOString()} className="font-medium text-fg" /> on {previous.deviceLabel}</>
                  ) : (
                    <>First session on this account</>
                  )}
                </span>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 animate-rise [animation-delay:120ms]">
            {passkeys.length === 0 ? (
              <RegisterPasskeyButton label="Enable biometric sign-in" size="lg" />
            ) : (
              <Link href="/dashboard/security" className={buttonClass("primary", "lg", "group")}>
                <Icon name="shieldCheck" className="h-4 w-4" /> Review security
                <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Account status"
          icon="shieldCheck"
          value="Verified"
          description={`Created ${fmtDate(user.createdAt)}`}
          status={{ tone: "success", label: "Active" }}
          href="/dashboard/profile"
        />
        <StatCard
          label="Active session"
          icon={device.kind === "desktop" ? "monitor" : "smartphone"}
          value={session.deviceLabel}
          description={<>Last active <RelativeTime iso={session.lastSeenAt.toISOString()} /></>}
          status={{ tone: "success", label: "Live", pulse: true }}
          href="/dashboard/devices"
        />
        <StatCard
          label="Passkeys"
          icon="fingerprint"
          value={<><CountUp value={passkeys.length} /> <span className="text-base font-medium text-fg-muted">registered</span></>}
          description={passkeys.length ? "Phishing-resistant sign-in on" : "Add Face ID or fingerprint"}
          status={passkeys.length ? { tone: "success", label: "Enabled" } : { tone: "warning", label: "Not set up" }}
          href="/dashboard/passkeys"
        />
        <StatCard
          label="Recent login"
          icon="login"
          value={<RelativeTime iso={session.createdAt.toISOString()} />}
          description={session.method === "PASSKEY" ? "Via passkey (biometric)" : "Via one-time code"}
          status={{ tone: "accent", label: "Current" }}
          href="/dashboard/activity"
        />
      </div>

      {/* Activity + device */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <Card className="animate-rise [animation-delay:200ms]">
          <CardHeader
            title="Security activity"
            description="Recent events recorded on your account"
            icon="activity"
            action={
              <Link href="/dashboard/activity" className={buttonClass("ghost", "sm", "group")}>
                View all <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />
          <CardBody>
            {activity.length ? <ActivityTimeline items={activity} /> : <EmptyState icon="activity" title="No activity yet" description="Sign-ins and security changes will appear here." />}
          </CardBody>
        </Card>

        <Card className="animate-rise overflow-hidden [animation-delay:260ms]">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Active device</h2>
            <span className="text-xs text-fg-subtle">1 of 1 allowed</span>
          </div>
          <DeviceCard
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
                <p className="text-xs text-fg-muted">New sign-ins replace this session.</p>
                <Link href="/dashboard/devices" className={buttonClass("secondary", "sm")}>
                  <Icon name="devices" className="h-4 w-4" /> Manage session
                </Link>
              </>
            }
          />
        </Card>
      </div>

      {/* Account security */}
      <Card className="animate-rise [animation-delay:320ms]">
        <div className="flex flex-col gap-5 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
          <div className="max-w-xl">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Account security</h2>
            <p className="mt-1 text-[13px] leading-5 text-fg-muted">
              {done === checklist.length
                ? "Every protection is in place. Nice work."
                : `${checklist.length - done} recommended step${checklist.length - done === 1 ? "" : "s"} left. Finish them right here.`}
            </p>
          </div>
          <ScoreRing value={done} total={checklist.length} size={96} label={`${done} of ${checklist.length} security steps complete`} />
        </div>
        <CardBody className="pt-5">
          <SecurityChecklist items={checklist} />
        </CardBody>
      </Card>
    </div>
  );
}
