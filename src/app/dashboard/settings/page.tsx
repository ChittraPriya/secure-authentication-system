import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/widgets";
import { requireDashboardSession } from "@/lib/dashboard";
import { SettingsPanel } from "./SettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireDashboardSession();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Settings" description="Personalise how the dashboard looks and behaves." />
      <SettingsPanel />
    </div>
  );
}
