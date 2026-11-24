"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { BrandMark, BrandName } from "@/components/BrandMark";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useMediaQuery } from "@/components/ui/hooks";
import { activeHref, helpItem, navGroups, type NavItem } from "./nav";
import { useShell } from "./ShellContext";

type Tip = { label: string; top: number; left: number } | null;

/**
 * Desktop: sticky rail that animates between 248px and 72px (forced rail on tablets).
 * Drawer: full-width labels inside the mobile slide-over.
 * The active item is marked by a single pill that glides between links.
 */
export function Sidebar({ variant, onClose }: { variant: "desktop" | "drawer"; onClose?: () => void }) {
  const { collapsed, setCollapsed, logout } = useShell();
  const pathname = usePathname();
  const isLg = useMediaQuery("(min-width: 1024px)", true);
  const rail = variant === "desktop" && (collapsed || !isLg);
  const active = activeHref(pathname);

  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number; animate: boolean } | null>(null);
  const [tip, setTip] = useState<Tip>(null);
  const [signingOut, setSigningOut] = useState(false);

  useLayoutEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>(`[data-href="${active}"]`);
    if (!el) { setPill(null); return; }
    setPill((p) => ({ top: el.offsetTop, height: el.offsetHeight, animate: p !== null }));
  }, [active, rail]);

  function showTip(label: string, el: HTMLElement) {
    if (!rail) return;
    const r = el.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 12 });
  }
  const tipHandlers = (label: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => showTip(label, e.currentTarget),
    onMouseLeave: () => setTip(null),
    onFocus: (e: React.FocusEvent<HTMLElement>) => showTip(label, e.currentTarget),
    onBlur: () => setTip(null),
  });

  const labelCls = cn("truncate transition-[opacity,transform] duration-200", rail ? "pointer-events-none -translate-x-1 opacity-0" : "translate-x-0 opacity-100");

  const link = (item: NavItem) => {
    const isActive = item.href === active;
    return (
      <Link
        key={item.href}
        href={item.href}
        data-href={item.href}
        aria-current={isActive ? "page" : undefined}
        aria-label={rail ? item.label : undefined}
        onClick={() => { setTip(null); onClose?.(); }}
        {...tipHandlers(item.label)}
        className={cn(
          "group relative z-10 flex h-9 items-center gap-3 overflow-hidden rounded-lg px-[15px] text-sm font-medium outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-accent/40",
          isActive ? "text-fg" : "text-fg-muted hover:bg-surface-2/80 hover:text-fg",
        )}
      >
        <Icon name={item.icon} className={cn("transition-[color,transform] duration-200 group-hover:scale-110", isActive ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted")} />
        <span className={labelCls}>{item.label}</span>
      </Link>
    );
  };

  const action = (label: string, icon: IconName, onClick: () => void, opts?: { danger?: boolean; className?: string; iconClass?: string; loading?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={rail ? label : undefined}
      {...tipHandlers(label)}
      className={cn(
        "group flex h-9 w-full items-center gap-3 overflow-hidden rounded-lg px-[15px] text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40",
        opts?.danger ? "text-fg-muted hover:bg-danger-soft hover:text-danger-text" : "text-fg-muted hover:bg-surface-2/80 hover:text-fg",
        opts?.className,
      )}
    >
      <Icon name={icon} className={cn("text-fg-subtle transition-transform duration-300 group-hover:text-current", opts?.iconClass, opts?.loading && "animate-pulse")} />
      <span className={labelCls}>{label}</span>
    </button>
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-line bg-surface",
        variant === "desktop"
          ? cn("sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-300 ease-out md:flex", collapsed ? "w-[72px]" : "w-[72px] lg:w-[248px]")
          : "h-full w-[min(288px,85vw)]",
      )}
      aria-label="Sidebar"
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 overflow-hidden border-b border-line px-[19px]">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/40" aria-label="OneKey dashboard" onClick={onClose}>
          <BrandMark className="transition-transform duration-500 ease-spring hover:rotate-[-8deg] hover:scale-105" />
          <span className={labelCls}><BrandName /></span>
        </Link>
        {variant === "drawer" && (
          <button onClick={onClose} className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-surface-2 hover:text-fg" aria-label="Close navigation">
            <Icon name="x" className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav ref={navRef} className="scrollbar-thin relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-3" aria-label="Main">
        {pill && (
          <span
            aria-hidden
            className={cn(
              "absolute inset-x-3 z-0 rounded-lg border border-line bg-surface-2 shadow-sm",
              "before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-accent",
              pill.animate && "transition-[transform,height] duration-300 ease-out",
            )}
            style={{ transform: `translateY(${pill.top}px)`, height: pill.height, top: 0 }}
          />
        )}
        {navGroups.map((g, gi) => (
          <div key={g.label} className={cn(gi > 0 && "mt-4")}>
            <div className="flex h-6 items-center px-[15px]">
              {rail ? <span className="h-px w-[18px] bg-line" /> : <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle animate-fadeUp">{g.label}</span>}
            </div>
            <div className="mt-1 space-y-0.5">{g.items.map(link)}</div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-line px-3 py-3">
        {link(helpItem)}
        {variant === "desktop" &&
          action(collapsed ? "Expand sidebar" : "Collapse sidebar", "chevronsLeft", () => { setTip(null); setCollapsed(!collapsed); }, {
            className: "hidden lg:flex",
            iconClass: collapsed ? "rotate-180" : "",
          })}
        {action(signingOut ? "Signing out…" : "Log out", "logout", async () => { setSigningOut(true); await logout(); }, { danger: true, loading: signingOut })}
      </div>

      {tip && (
        <div className="pointer-events-none fixed z-[60]" style={{ top: tip.top, left: tip.left }}>
          <div key={tip.label} className="-translate-y-1/2">
            <div className="flex items-center gap-2 whitespace-nowrap rounded-md bg-fg px-2.5 py-1.5 text-xs font-medium text-bg shadow-pop animate-[tipIn_0.16s_ease-out_both]">
              {tip.label}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
