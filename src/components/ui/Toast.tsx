"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";
import type { Tone } from "./Badge";

type ToastInput = { title: string; description?: string; tone?: Tone; duration?: number };
type ToastItem = ToastInput & { id: number };

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});

/** Returns `toast({ title, description, tone })`. No-op outside the dashboard. */
export function useToast() {
  return useContext(ToastCtx);
}

const toneIcon: Record<Tone, { icon: IconName; cls: string }> = {
  success: { icon: "checkCircle", cls: "text-success" },
  danger: { icon: "alertCircle", cls: "text-danger" },
  warning: { icon: "alertTriangle", cls: "text-warning" },
  accent: { icon: "sparkles", cls: "text-accent" },
  neutral: { icon: "info", cls: "text-fg-subtle" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const push = useCallback((t: ToastInput) => {
    const id = nextId.current++;
    setItems((list) => [...list.slice(-3), { ...t, id }]);
  }, []);
  const remove = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6">
        {items.map((t) => <Toast key={t.id} item={t} onDone={() => remove(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function Toast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const [state, setState] = useState<"enter" | "idle" | "leave">("enter");
  const duration = item.duration ?? 4500;
  const remaining = useRef(duration);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [paused, setPaused] = useState(false);

  const leave = useCallback(() => { setState("leave"); setTimeout(onDone, 220); }, [onDone]);
  const start = useCallback(() => { started.current = Date.now(); timer.current = setTimeout(leave, remaining.current); }, [leave]);

  useEffect(() => {
    const r = setTimeout(() => setState("idle"), 20);
    start();
    return () => { clearTimeout(r); clearTimeout(timer.current); };
  }, [start]);

  const tone = toneIcon[item.tone ?? "neutral"];
  return (
    <div
      role="status"
      onMouseEnter={() => { setPaused(true); clearTimeout(timer.current); remaining.current -= Date.now() - started.current; }}
      onMouseLeave={() => { setPaused(false); start(); }}
      className={cn(
        "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface shadow-pop",
        "transition-all duration-300 ease-spring",
        state === "enter" && "translate-y-4 scale-95 opacity-0",
        state === "idle" && "translate-y-0 scale-100 opacity-100",
        state === "leave" && "translate-x-6 scale-95 opacity-0 duration-200 ease-out",
      )}
    >
      <div className="flex items-start gap-3 p-3.5 pr-10">
        <Icon name={tone.icon} className={cn("mt-px h-5 w-5", tone.cls)} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{item.title}</p>
          {item.description && <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">{item.description}</p>}
        </div>
      </div>
      <button onClick={leave} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-fg-subtle transition hover:bg-surface-2 hover:text-fg" aria-label="Dismiss">
        <Icon name="x" className="h-3.5 w-3.5" />
      </button>
      <span
        className={cn("absolute bottom-0 left-0 h-0.5 w-full origin-left opacity-70", tone.cls.replace("text-", "bg-"))}
        style={{ animation: `progress ${duration}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
      />
    </div>
  );
}
