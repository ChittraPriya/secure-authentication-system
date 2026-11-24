import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/widgets";
import { requireDashboardSession } from "@/lib/dashboard";
import { HelpCenter } from "./HelpCenter";

export const metadata: Metadata = { title: "Help & Support" };

export default async function HelpPage() {
  await requireDashboardSession();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Support" title="Help & Support" description="Answers to common questions about signing in, passkeys and devices." />
      <HelpCenter />
    </div>
  );
}
