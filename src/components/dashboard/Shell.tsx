"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/cn";
import type { ActivityItem } from "@/lib/activity";
import { ToastProvider } from "@/components/ui/Toast";
import { useMediaQuery, usePresence, useScrollLock } from "@/components/ui/hooks";
import { ShellContext, type ShellState, type Theme, type Viewer } from "./ShellContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandMenu } from "./CommandMenu";
import { SessionWatcher } from "./SessionWatcher";

const YEAR = 60 * 60 * 24 * 365;
function setPref(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
}

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

export function Shell({
  viewer,
  notifications,
  initialTheme,
  initialCollapsed,
  initialReduceMotion,
  children,
}: {
  viewer: Viewer;
  notifications: ActivityItem[];
  initialTheme: Theme;
  initialCollapsed: boolean;
  initialReduceMotion: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [collapsed, setCollapsedState] = useState(initialCollapsed);
  const [reduceMotion, setReduceMotionState] = useState(initialReduceMotion);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  const setTheme = useCallback((next: Theme, origin?: { x: number; y: number }) => {
    const apply = () => { flushSync(() => setThemeState(next)); setPref("ok_theme", next); };
    const doc = document as ViewTransitionDoc;
    const calm = reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || calm) return apply();
    // Circular reveal expanding from the click point.
    const x = origin?.x ?? window.innerWidth - 80;
    const y = origin?.y ?? 28;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = doc.startViewTransition(apply);
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    }).catch(() => {});
  }, [reduceMotion]);

  const setCollapsed = useCallback((v: boolean) => { setCollapsedState(v); setPref("ok_sidebar", v ? "1" : "0"); }, []);
  const setReduceMotion = useCallback((v: boolean) => { setReduceMotionState(v); setPref("ok_motion", v ? "reduce" : "full"); }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }, [router]);

  // Close the mobile drawer on navigation.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Global shortcuts: Ctrl/⌘+K command menu, "[" toggles sidebar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCommandOpen((o) => !o); return; }
      const el = e.target as HTMLElement;
      const typing = el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if (!typing && e.key === "[" && !e.metaKey && !e.ctrlKey) setCollapsed(!collapsed);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, setCollapsed]);

  const ctx = useMemo<ShellState>(() => ({
    viewer, theme, resolvedTheme, setTheme, collapsed, setCollapsed, reduceMotion, setReduceMotion,
    openCommand: () => setCommandOpen(true), logout,
  }), [viewer, theme, resolvedTheme, setTheme, collapsed, setCollapsed, reduceMotion, setReduceMotion, logout]);

  // One pointer listener drives every `.spotlight` card's cursor glow.
  function onPointerMove(e: React.PointerEvent) {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".spotlight");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <ShellContext.Provider value={ctx}>
      <div
        className={cn("theme-root min-h-screen bg-bg text-fg", theme === "dark" && "dark", theme === "system" && "theme-system", reduceMotion && "reduce-motion")}
        onPointerMove={onPointerMove}
      >
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar variant="desktop" />
            <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar onMenu={() => setMobileOpen(true)} notifications={notifications} />
              <main id="main" className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">{children}</main>
            </div>
          </div>
          <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
          <SessionWatcher />
          <div id="ok-portal" />
        </ToastProvider>
      </div>
    </ShellContext.Provider>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mounted, visible } = usePresence(open, 300);
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className={cn("absolute inset-0 bg-[rgb(8_10_20/0.45)] backdrop-blur-[2px] transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div className={cn("absolute inset-y-0 left-0 shadow-pop transition-transform duration-300 ease-out", visible ? "translate-x-0" : "-translate-x-full")}>
        <Sidebar variant="drawer" onClose={onClose} />
      </div>
    </div>
  );
}
