import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-4 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-sm shadow-inner-hi hover:bg-accent-hover focus-visible:ring-accent/30",
  secondary: "border border-line-strong bg-surface text-fg shadow-sm hover:border-fg-subtle/50 hover:bg-surface-2 focus-visible:ring-accent/20",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:ring-accent/20",
  subtle: "bg-accent-soft text-accent-text hover:bg-accent/15 focus-visible:ring-accent/25",
  danger: "bg-danger text-white shadow-sm shadow-inner-hi hover:brightness-110 focus-visible:ring-danger/30",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9",
  "icon-sm": "h-8 w-8",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Spin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 animate-spin", className)} aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" fill="none" />
      <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", loading, icon, iconRight, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spin /> : icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      {children}
      {iconRight && !loading && <Icon name={iconRight} className="h-4 w-4" />}
    </button>
  );
});
