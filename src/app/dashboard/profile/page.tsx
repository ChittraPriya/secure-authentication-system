import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/widgets";
import { getPasskeys, requireDashboardSession } from "@/lib/dashboard";
import { initials } from "@/lib/format";
import { ProfileView } from "./ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireDashboardSession();
  const { user } = session;
  const passkeys = await getPasskeys(user.id);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Profile" description="Your personal details and verified contact methods." />
      <ProfileView
        user={{
          firstName: user.firstName,
          surname: user.surname,
          dob: user.dob.toISOString().slice(0, 10),
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt.toISOString(),
          initials: initials(user.firstName, user.surname),
          passkeys: passkeys.length,
        }}
      />
    </div>
  );
}
