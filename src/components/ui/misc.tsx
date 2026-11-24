"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { timeAgo, fmtDateTime } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

/** Shimmering placeholder. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}

export function EmptyState({ icon, title, description, action, className }: { icon: IconName; title: string; description: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <div className="relative">
        <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-accent/10 [animation-duration:2.5s]" />
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-surface-2 text-fg-muted animate-float">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-fg">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-5 text-fg-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Accessible toggle switch with a springy knob. */
export function Switch({ checked, onChange, disabled, label, id }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-accent bg-accent" : "border-line-strong bg-surface-3",
      )}
    >
      <span className={cn("inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-spring", checked ? "translate-x-[22px]" : "translate-x-[2px]")} />
    </button>
  );
}

/** Animated count-up (ease-out cubic). Skips animation when reduced motion is preferred. */
export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector(".reduce-motion")) { setN(value); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={cn("tabular-nums", className)}>{n}</span>;
}

/** "3 min ago" that keeps itself fresh; full timestamp on hover. */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const d = new Date(iso);
  return (
    <time dateTime={iso} title={fmtDateTime(d)} className={className} suppressHydrationWarning>
      {timeAgo(d)}
    </time>
  );
}

/** Circular progress ring that sweeps in on mount. */
export function ScoreRing({ value, total, size = 112, label }: { value: number; total: number; size?: number; label?: string }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);
  const tone = pct >= 0.99 ? "stroke-success" : pct >= 0.6 ? "stroke-accent" : "stroke-warning";
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${value} of ${total} complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-surface-3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn("fill-none transition-[stroke-dashoffset] duration-[1400ms] ease-out", tone)}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-semibold tracking-tight text-fg">
          <CountUp value={value} />
          <span className="text-base text-fg-subtle">/{total}</span>
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">Complete</div>
      </div>
    </div>
  );
}
