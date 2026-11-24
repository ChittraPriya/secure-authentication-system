import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "danger" | "accent" | "neutral";

const tones: Record<Tone, { box: string; dot: string }> = {
  success: { box: "bg-success-soft text-success-text ring-success/20", dot: "bg-success" },
  warning: { box: "bg-warning-soft text-warning-text ring-warning/25", dot: "bg-warning" },
  danger: { box: "bg-danger-soft text-danger-text ring-danger/20", dot: "bg-danger" },
  accent: { box: "bg-accent-soft text-accent-text ring-accent/20", dot: "bg-accent" },
  neutral: { box: "bg-surface-2 text-fg-muted ring-line-strong/70", dot: "bg-fg-subtle" },
};

export function Badge({ tone = "neutral", dot, pulse, className, children }: { tone?: Tone; dot?: boolean; pulse?: boolean; className?: string; children: React.ReactNode }) {
  const t = tones[tone];
  return (
    <span className={cn("inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium ring-1 ring-inset", t.box, className)}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", t.dot)} />}
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", t.dot)} />
        </span>
      )}
      {children}
    </span>
  );
}

export const toneIconBox: Record<Tone, string> = {
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  accent: "bg-accent-soft text-accent-text",
  neutral: "bg-surface-2 text-fg-muted",
};
