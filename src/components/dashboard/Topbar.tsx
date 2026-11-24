"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { ActivityItem } from "@/lib/activity";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { RelativeTime } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/Tooltip";
import { toneIconBox } from "@/components/ui/Badge";
import { useIsMac } from "@/components/ui/hooks";
import { navFor } from "./nav";
import { useShell } from "./ShellContext";

export function Topbar({ onMenu, notifications }: { onMenu: () => void; notifications: ActivityItem[] }) {
  const pathname = usePathname();
  const current = navFor(pathname);
  const { openCommand } = useShell();
  const isMac = useIsMac();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 sm:px-6 lg:px-10",
        scrolled ? "border-line bg-bg/80 shadow-[0_1px_0_rgb(var(--shadow)/0.02),0_8px_24px_-16px_rgb(var(--shadow)/0.25)]" : "border-transparent bg-bg/60",
      )}
    >
      <button onClick={onMenu} className={buttonClass("ghost", "icon", "md:hidden")} aria-label="Open navigation">
        <Icon name="menu" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-sm">
          <li className="hidden sm:block">
            <Link href="/dashboard" className="text-fg-subtle transition-colors hover:text-fg">OneKey</Link>
          </li>
          <li className="hidden sm:block text-fg-subtle/60" aria-hidden><Icon name="chevronRight" className="h-3.5 w-3.5" /></li>
          {current.href !== "/dashboard" && (
            <>
              <li className="hidden md:block"><Link href="/dashboard" className="text-fg-subtle transition-colors hover:text-fg">Dashboard</Link></li>
              <li className="hidden md:block text-fg-subtle/60" aria-hidden><Icon name="chevronRight" className="h-3.5 w-3.5" /></li>
            </>
          )}
          <li className="truncate font-medium text-fg" aria-current="page">
            <span key={current.href} className="inline-block animate-fadeUp">{current.href === "/dashboard" ? "Overview" : current.label}</span>
          </li>
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={openCommand}
          className="group hidden h-9 w-44 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-sm text-fg-subtle shadow-sm transition hover:border-line-strong hover:text-fg-muted md:flex lg:w-60"
          aria-label="Search or jump to (command menu)"
        >
          <Icon name="search" className="h-4 w-4" />
          <span className="flex-1 text-left">Search or jump to…</span>
          <span className="flex gap-0.5"><kbd className="kbd">{isMac ? "⌘" : "Ctrl"}</kbd><kbd className="kbd">K</kbd></span>
        </button>
        <Tooltip label="Search" className="md:hidden">
          <button onClick={openCommand} className={buttonClass("ghost", "icon")} aria-label="Search"><Icon name="search" /></button>
        </Tooltip>
        <NotificationsMenu items={notifications} />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useShell();
  const dark = resolvedTheme === "dark";
  return (
    <Tooltip label={dark ? "Light mode" : "Dark mode"}>
      <button
        onClick={(e) => setTheme(dark ? "light" : "dark", { x: e.clientX, y: e.clientY })}
        className={buttonClass("ghost", "icon")}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="relative h-[18px] w-[18px]">
          <Icon name="sun" className={cn("absolute inset-0 transition-all duration-500 ease-spring", dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
          <Icon name="moon" className={cn("absolute inset-0 transition-all duration-500 ease-spring", dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
        </span>
      </button>
    </Tooltip>
  );
}

const SEEN_KEY = "ok_notif_seen";

function NotificationsMenu({ items }: { items: ActivityItem[] }) {
  const [seen, setSeen] = useState<number | null>(null);
  useEffect(() => {
    try { setSeen(Number(localStorage.getItem(SEEN_KEY) ?? 0)); } catch { setSeen(0); }
  }, []);
  const unread = seen === null ? 0 : items.filter((n) => Date.parse(n.at) > seen).length;

  function markRead() {
    const now = Date.now();
    try { localStorage.setItem(SEEN_KEY, String(now)); } catch { /* storage unavailable */ }
    setSeen(now);
  }

  return (
    <Menu
      label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      triggerClassName={buttonClass("ghost", "icon", "relative")}
      panelClassName="w-[22rem] p-0 max-sm:fixed max-sm:inset-x-3 max-sm:top-14 max-sm:w-auto"
      button={() => (
        <>
          <Icon name="bell" />
          {unread > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />
            </span>
          )}
        </>
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-fg">Security notifications</p>
        <button onClick={markRead} disabled={!unread} className="text-xs font-medium text-accent-text hover:underline disabled:text-fg-subtle disabled:no-underline">
          Mark all as read
        </button>
      </div>
      <div className="scrollbar-thin max-h-[22rem] overflow-y-auto p-1.5">
        {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-fg-muted">No security events yet.</p>}
        {items.map((n) => {
          const isNew = seen !== null && Date.parse(n.at) > seen;
          return (
            <Link key={n.id} role="menuitem" href="/dashboard/activity" className="flex gap-3 rounded-lg px-2.5 py-2.5 outline-none transition-colors hover:bg-surface-2 focus-visible:bg-surface-2">
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", toneIconBox[n.tone])}><Icon name={n.icon} className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-fg">{n.title}</span>
                  {isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="unread" />}
                </span>
                <span className="block truncate text-xs text-fg-muted">{n.detail ?? n.device ?? "Security event"}</span>
                <RelativeTime iso={n.at} className="text-[11px] text-fg-subtle" />
              </span>
            </Link>
          );
        })}
      </div>
      <Link href="/dashboard/activity" className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-2.5 text-[13px] font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg sm:rounded-b-xl">
        View all activity <Icon name="arrowRight" className="h-3.5 w-3.5" />
      </Link>
    </Menu>
  );
}

function UserMenu() {
  const { viewer, logout, openCommand } = useShell();
  return (
    <Menu
      label="Account menu"
      className="ml-1"
      triggerClassName="flex items-center gap-2 rounded-full p-0.5 outline-none transition hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-accent/25 sm:pr-2"
      panelClassName="w-64"
      button={(open) => (
        <>
          <Avatar initials={viewer.initials} />
          <Icon name="chevronDown" className={cn("hidden h-3.5 w-3.5 text-fg-subtle transition-transform duration-200 sm:block", open && "rotate-180")} />
        </>
      )}
    >
      <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-1.5">
        <Avatar initials={viewer.initials} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{viewer.fullName}</p>
          <p className="truncate text-xs text-fg-muted">{viewer.contact}</p>
        </div>
      </div>
      <MenuSeparator />
      <MenuItem icon="user" href="/dashboard/profile">Profile</MenuItem>
      <MenuItem icon="shieldCheck" href="/dashboard/security">Security</MenuItem>
      <MenuItem icon="settings" href="/dashboard/settings">Settings</MenuItem>
      <MenuItem icon="command" onSelect={openCommand} shortcut="⌘K">Command menu</MenuItem>
      <MenuItem icon="help" href="/dashboard/help">Help & Support</MenuItem>
      <MenuSeparator />
      <MenuItem icon="logout" danger onSelect={logout}>Log out</MenuItem>
    </Menu>
  );
}

export function Avatar({ initials, size = "md" }: { initials: string; size?: "md" | "lg" | "xl" }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7c6cff] to-[#4f3bd6] font-semibold text-white shadow-inner-hi ring-2 ring-surface",
        { md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm", xl: "h-16 w-16 text-xl" }[size],
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
