import type { IconName } from "@/components/ui/Icon";

export type NavItem = { href: string; label: string; icon: IconName; description: string };

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "dashboard", description: "Your account security at a glance" }],
  },
  {
    label: "Security",
    items: [
      { href: "/dashboard/security", label: "Security", icon: "shieldCheck", description: "Checklist and protection status" },
      { href: "/dashboard/devices", label: "Active Devices", icon: "devices", description: "Current session and history" },
      { href: "/dashboard/passkeys", label: "Passkeys", icon: "fingerprint", description: "Face ID, Touch ID and security keys" },
      { href: "/dashboard/activity", label: "Login Activity", icon: "activity", description: "Full security audit log" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: "user", description: "Personal details and contacts" },
      { href: "/dashboard/settings", label: "Settings", icon: "settings", description: "Appearance, motion and danger zone" },
    ],
  },
];

export const helpItem: NavItem = { href: "/dashboard/help", label: "Help & Support", icon: "help", description: "FAQ and keyboard shortcuts" };

export const allNav: NavItem[] = [...navGroups.flatMap((g) => g.items), helpItem];

export function activeHref(pathname: string) {
  const match = allNav
    .filter((i) => (i.href === "/dashboard" ? pathname === "/dashboard" : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? "/dashboard";
}

export function navFor(pathname: string) {
  return allNav.find((i) => i.href === activeHref(pathname)) ?? allNav[0];
}
