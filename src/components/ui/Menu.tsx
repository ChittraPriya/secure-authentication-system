"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";
import { usePresence } from "./hooks";

const MenuCtx = createContext<{ close: () => void }>({ close: () => {} });

/**
 * Dropdown menu: click/keyboard to open, ArrowUp/Down to move, Escape or outside click to close.
 * `button` receives `open` so the trigger can reflect state.
 */
export function Menu({
  button,
  label,
  children,
  align = "end",
  className,
  panelClassName,
  triggerClassName,
}: {
  button: (open: boolean) => React.ReactNode;
  label: string;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const { mounted, visible } = usePresence(open, 140);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) { if (!root.current?.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
        if (!items.length) return;
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next].focus();
      }
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <MenuCtx.Provider value={{ close: () => setOpen(false) }}>
      <div ref={root} className={cn("relative", className)}>
        <button
          ref={trigger}
          type="button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true); setTimeout(() => panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(), 20); } }}
          className={triggerClassName}
        >
          {button(open)}
        </button>
        {mounted && (
          <div
            ref={panel}
            role="menu"
            aria-label={label}
            className={cn(
              "absolute top-full z-50 mt-2 min-w-[14rem] rounded-xl border border-line bg-surface p-1.5 shadow-pop",
              "transition duration-150 ease-out",
              align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
              visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-[0.96] opacity-0",
              panelClassName,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </MenuCtx.Provider>
  );
}

const itemCls =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-fg outline-none transition-colors hover:bg-surface-2 focus-visible:bg-surface-2";

export function MenuItem({
  icon,
  href,
  onSelect,
  danger,
  shortcut,
  disabled,
  children,
}: {
  icon?: IconName;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  shortcut?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { close } = useContext(MenuCtx);
  const content = (
    <>
      {icon && <Icon name={icon} className={cn("h-4 w-4", danger ? "text-danger-text" : "text-fg-subtle")} />}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="kbd">{shortcut}</span>}
    </>
  );
  const cls = cn(itemCls, danger && "text-danger-text hover:bg-danger-soft focus-visible:bg-danger-soft", disabled && "pointer-events-none opacity-50");
  if (href) {
    return <Link role="menuitem" href={href} className={cls} onClick={close} aria-disabled={disabled}>{content}</Link>;
  }
  return (
    <button role="menuitem" type="button" className={cls} aria-disabled={disabled} onClick={() => { close(); onSelect?.(); }}>
      {content}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">{children}</div>;
}
