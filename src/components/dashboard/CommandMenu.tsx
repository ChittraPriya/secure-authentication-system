"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";
import { usePresence, useScrollLock } from "@/components/ui/hooks";
import { allNav } from "./nav";
import { useShell } from "./ShellContext";

type Command = { id: string; group: "Navigate" | "Actions"; label: string; hint?: string; icon: IconName; shortcut?: string; run: () => void };

/** ⌘K / Ctrl+K palette: fuzzy-ish filter, arrow keys, Enter to run. */
export function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { resolvedTheme, setTheme, collapsed, setCollapsed, logout } = useShell();
  const { mounted, visible } = usePresence(open, 180);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  const commands = useMemo<Command[]>(() => [
    ...allNav.map((n) => ({ id: n.href, group: "Navigate" as const, label: n.label, hint: n.description, icon: n.icon, run: () => router.push(n.href) })),
    { id: "passkey", group: "Actions", label: "Register a new passkey", hint: "Face ID, Touch ID, Windows Hello", icon: "fingerprint", run: () => router.push("/dashboard/passkeys") },
    { id: "theme", group: "Actions", label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`, icon: resolvedTheme === "dark" ? "sun" : "moon", run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark") },
    { id: "sidebar", group: "Actions", label: collapsed ? "Expand sidebar" : "Collapse sidebar", icon: "panel", shortcut: "[", run: () => setCollapsed(!collapsed) },
    { id: "logout", group: "Actions", label: "Log out", hint: "End this device's session", icon: "logout", run: () => { void logout(); } },
  ], [router, resolvedTheme, setTheme, collapsed, setCollapsed, logout]);

  const results = useMemo(() => {
    const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return commands;
    return commands.filter((c) => {
      const hay = `${c.label} ${c.hint ?? ""} ${c.group}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q, commands]);

  useEffect(() => { setIndex(0); }, [q]);
  useEffect(() => {
    if (open) { setQ(""); setTimeout(() => input.current?.focus(), 20); }
  }, [open]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  function run(c: Command | undefined) {
    if (!c) return;
    onClose();
    setTimeout(c.run, 60);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(results[index]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  if (!mounted) return null;
  let flat = -1;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-3 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command menu">
      <div className={cn("absolute inset-0 bg-[rgb(8_10_20/0.4)] backdrop-blur-[3px] transition-opacity duration-200", visible ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-[600px] overflow-hidden rounded-2xl border border-line bg-surface shadow-pop transition duration-200 ease-out",
          visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-3 scale-[0.97] opacity-0",
        )}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" className="text-fg-subtle" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages and actions…"
            className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div ref={list} id="cmd-list" role="listbox" className="scrollbar-thin max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-fg">No results for “{q}”</p>
              <p className="mt-1 text-[13px] text-fg-muted">Try “passkey”, “devices” or “theme”.</p>
            </div>
          )}
          {(["Navigate", "Actions"] as const).map((group) => {
            const items = results.filter((r) => r.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-1">
                <p className="px-2.5 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">{group}</p>
                {items.map((c) => {
                  flat++;
                  const i = flat;
                  const selected = i === index;
                  return (
                    <div
                      key={c.id}
                      id={`cmd-${c.id}`}
                      data-index={i}
                      role="option"
                      aria-selected={selected}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => run(c)}
                      className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors duration-100", selected ? "bg-surface-2" : "")}
                    >
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors", selected ? "border-accent/30 bg-accent-soft text-accent-text" : "border-line bg-surface text-fg-subtle")}>
                        <Icon name={c.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{c.label}</span>
                        {c.hint && <span className="block truncate text-xs text-fg-muted">{c.hint}</span>}
                      </span>
                      {c.shortcut && <kbd className="kbd">{c.shortcut}</kbd>}
                      <Icon name="arrowRight" className={cn("h-4 w-4 text-fg-subtle transition-all duration-150", selected ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0")} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-surface-2/50 px-4 py-2.5 text-[11px] text-fg-subtle">
          <span className="flex items-center gap-1"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="kbd">↵</kbd> select</span>
          <span className="ml-auto hidden items-center gap-1 sm:flex"><kbd className="kbd">[</kbd> toggle sidebar</span>
        </div>
      </div>
    </div>
  );
}
