import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ActivityItem } from "@/lib/activity";
import { isMeaningfulIp, parseUserAgent } from "@/lib/device";
import { fmtDateTime } from "@/lib/format";
import { Badge, toneIconBox, type Tone } from "@/components/ui/Badge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RelativeTime } from "@/components/ui/misc";

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-accent-text">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  icon,
  value,
  description,
  status,
  href,
}: {
  label: string;
  icon: IconName;
  value: React.ReactNode;
  description: React.ReactNode;
  status?: { tone: Tone; label: string; pulse?: boolean };
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-fg-muted">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-surface-2 text-fg-subtle transition-colors duration-300 group-hover:border-accent/30 group-hover:bg-accent-soft group-hover:text-accent-text">
            <Icon name={icon} className="h-3.5 w-3.5" />
          </span>
          {label}
        </span>
        {status && <Badge tone={status.tone} dot pulse={status.pulse}>{status.label}</Badge>}
      </div>
      <div className="mt-4 truncate text-[22px] font-semibold leading-tight tracking-tight text-fg">{value}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="truncate text-[13px] text-fg-muted">{description}</p>
        {href && <Icon name="arrowUpRight" className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-fg-subtle opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />}
      </div>
    </>
  );
  const cls = "card spotlight lift group block p-4 outline-none focus-visible:ring-4 focus-visible:ring-accent/20 sm:p-5";
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Vertical timeline whose spine "draws" downward while items cascade in. */
export function ActivityTimeline({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {items.length > 1 && <span aria-hidden className="absolute bottom-4 left-4 top-4 w-px origin-top animate-draw bg-gradient-to-b from-line-strong via-line to-transparent" />}
      {items.map((it, i) => (
        <li key={it.id} className="group relative flex gap-3.5 pb-5 animate-rise last:pb-0" style={{ animationDelay: `${120 + i * 70}ms` }}>
          <span className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-surface transition-transform duration-300 group-hover:scale-110", toneIconBox[it.tone])}>
            <Icon name={it.icon} className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-5 text-fg">{it.title}</p>
              <Badge tone={it.tone} className="shrink-0">{it.status}</Badge>
            </div>
            {it.detail && <p className="mt-0.5 truncate text-[13px] text-fg-muted">{it.detail}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-fg-subtle">
              <RelativeTime iso={it.at} />
              {it.device && <><span aria-hidden>·</span><span>{it.device}</span></>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const kindIcon: Record<string, IconName> = { desktop: "monitor", mobile: "smartphone", tablet: "tablet" };

export type SessionView = { userAgent: string | null; deviceLabel: string; method: string; ip: string | null; createdAt: string; lastSeenAt: string; expiresAt: string };

/** Hero card for the current device: animated scanner glyph + live status + facts. */
export function DeviceCard({ session, footer, size = "md" }: { session: SessionView; footer?: React.ReactNode; size?: "md" | "lg" }) {
  const d = parseUserAgent(session.userAgent);
  const rows: [string, React.ReactNode][] = [
    ["Browser", d.browser],
    ["Operating system", d.os],
    ["Last active", <RelativeTime key="la" iso={session.lastSeenAt} />],
    ["Signed in", fmtDateTime(new Date(session.createdAt))],
    ["Sign-in method", session.method === "PASSKEY" ? "Passkey (biometric)" : "One-time code"],
    ["Session expires", fmtDateTime(new Date(session.expiresAt))],
  ];
  if (isMeaningfulIp(session.ip)) rows.push(["IP address", <span key="ip" className="font-mono text-[13px]">{session.ip}</span>]);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-4", size === "lg" ? "p-6" : "p-5")}>
        <div className="relative">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-success/15 [animation-duration:3s]" aria-hidden />
          <div className={cn("relative grid place-items-center overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent-soft to-surface text-accent-text", size === "lg" ? "h-16 w-16" : "h-14 w-14")}>
            <Icon name={kindIcon[d.kind]} className={size === "lg" ? "h-7 w-7" : "h-6 w-6"} strokeWidth={1.6} />
            <span className="absolute inset-x-2 h-6 animate-scan-line bg-gradient-to-b from-transparent via-accent/25 to-transparent" aria-hidden />
          </div>
        </div>
        <div className="min-w-0">
          <p className={cn("truncate font-semibold tracking-tight text-fg", size === "lg" ? "text-lg" : "text-[15px]")}>{session.deviceLabel}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="success" dot pulse>Active now</Badge>
            <Badge tone="neutral">This device</Badge>
          </div>
        </div>
      </div>
      <dl className={cn("grid flex-1 gap-x-6 gap-y-3.5 border-t border-line", size === "lg" ? "grid-cols-1 p-6 sm:grid-cols-2" : "grid-cols-2 p-5")}>
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-fg-subtle">{k}</dt>
            <dd className="mt-0.5 truncate text-[13px] font-medium text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
    </div>
  );
}
