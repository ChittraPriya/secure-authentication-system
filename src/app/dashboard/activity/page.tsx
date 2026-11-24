import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/widgets";
import { toActivityItem } from "@/lib/activity";
import { getEvents, requireDashboardSession } from "@/lib/dashboard";
import { ActivityExplorer } from "./ActivityExplorer";

export const metadata: Metadata = { title: "Login Activity" };

export default async function ActivityPage() {
  const session = await requireDashboardSession();
  const events = await getEvents(session.userId, 200);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Audit log" title="Login activity" description="Every sign-in, verification, passkey change and revoked session on your account." />
      <ActivityExplorer items={events.map(toActivityItem)} />
    </div>
  );
}
