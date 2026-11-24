"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";
import { usePresence, useScrollLock } from "./hooks";
import { toneIconBox, type Tone } from "./Badge";

export function portalTarget() {
  return (typeof document !== "undefined" && document.getElementById("ok-portal")) || (typeof document !== "undefined" ? document.body : null);
}

/**
 * Accessible modal: portal, Escape to close, focus moved in and restored,
 * Tab trapped inside, scroll locked, animated enter/exit.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  tone = "accent",
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconName;
  tone?: Tone;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const { mounted, visible } = usePresence(open, 200);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus], input, textarea, select, button:not([data-close])");
      (first ?? panel.current)?.focus();
    }, 30);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey, true); prev?.focus?.(); };
  }, [open, onClose]);

  const target = portalTarget();
  if (!mounted || !target) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className={cn("absolute inset-0 bg-[rgb(8_10_20/0.45)] backdrop-blur-[3px] transition-opacity duration-200", visible ? "opacity-100" : "opacity-0")}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full rounded-t-2xl border border-line bg-surface shadow-pop outline-none sm:rounded-2xl",
          "transition duration-200 ease-out",
          { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg" }[size],
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]",
        )}
      >
        <button data-close onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-fg-subtle transition hover:bg-surface-2 hover:text-fg" aria-label="Close">
          <Icon name="x" className="h-4 w-4" />
        </button>
        <div className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
          {icon && (
            <span className={cn("mb-4 grid h-11 w-11 place-items-center rounded-xl animate-pop", toneIconBox[tone])}>
              <Icon name={icon} className="h-5 w-5" />
            </span>
          )}
          <h2 id={titleId} className="pr-8 text-base font-semibold tracking-tight text-fg">{title}</h2>
          {description && <p id={descId} className="mt-1.5 text-sm leading-6 text-fg-muted">{description}</p>}
          {children && <div className="mt-5">{children}</div>}
        </div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-3.5 sm:flex-row sm:justify-end sm:rounded-b-2xl sm:px-6">{footer}</div>}
      </div>
    </div>,
    target,
  );
}
