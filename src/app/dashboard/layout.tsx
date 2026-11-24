import { cookies } from "next/headers";
import { Shell } from "@/components/dashboard/Shell";
import type { Theme } from "@/components/dashboard/ShellContext";
import { toActivityItem } from "@/lib/activity";
import { getEvents, requireDashboardSession } from "@/lib/dashboard";
import { initials } from "@/lib/format";
import { maskIdentifier } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Auth gate + app chrome for every /dashboard route. Preferences come from cookies so SSR matches (no theme flash). */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireDashboardSession();
  const { user } = session;
  const [events, jar] = await Promise.all([getEvents(user.id, 8), cookies()]);

  const themeCookie = jar.get("ok_theme")?.value;
  const theme: Theme = themeCookie === "dark" || themeCookie === "system" ? themeCookie : "light";

  return (
    <Shell
      viewer={{
        firstName: user.firstName,
        surname: user.surname,
        fullName: `${user.firstName} ${user.surname}`,
        initials: initials(user.firstName, user.surname),
        contact: maskIdentifier(user.email ?? user.phone ?? ""),
      }}
      notifications={events.map(toActivityItem)}
      initialTheme={theme}
      initialCollapsed={jar.get("ok_sidebar")?.value === "1"}
      initialReduceMotion={jar.get("ok_motion")?.value === "reduce"}
    >
      {children}
    </Shell>
  );
}
