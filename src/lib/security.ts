import type { IconName } from "@/components/ui/Icon";

export type ChecklistAction =
  | { kind: "add-contact"; channel: "email" | "phone"; label: string }
  | { kind: "add-passkey"; label: string }
  | { kind: "link"; href: string; label: string };

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  done: boolean;
  statusLabel: string;
  action?: ChecklistAction;
};

/**
 * Derived only from real account state — no invented scores.
 * Contacts can only be stored after OTP verification, so a present email/phone is a verified one.
 */
export function securityChecklist(input: { email: string | null; phone: string | null; passkeyCount: number }): ChecklistItem[] {
  const { email, phone, passkeyCount } = input;
  return [
    {
      id: "email",
      title: "Email verification",
      description: email ? "Your email is verified and can receive sign-in codes." : "Add an email so you can receive codes there too.",
      icon: "mail",
      done: Boolean(email),
      statusLabel: email ? "Verified" : "Not added",
      action: email ? undefined : { kind: "add-contact", channel: "email", label: "Add email" },
    },
    {
      id: "phone",
      title: "Phone verification",
      description: phone ? "Your phone number is verified for SMS codes." : "Add a mobile number for SMS sign-in codes.",
      icon: "phone",
      done: Boolean(phone),
      statusLabel: phone ? "Verified" : "Not added",
      action: phone ? undefined : { kind: "add-contact", channel: "phone", label: "Add phone" },
    },
    {
      id: "passkey",
      title: "Passkey / biometric login",
      description: passkeyCount
        ? `${passkeyCount} passkey${passkeyCount === 1 ? "" : "s"} registered — phishing-resistant sign-in is on.`
        : "Sign in with Face ID, Touch ID, Windows Hello or fingerprint.",
      icon: "fingerprint",
      done: passkeyCount > 0,
      statusLabel: passkeyCount ? "Enabled" : "Not set up",
      action: passkeyCount ? { kind: "link", href: "/dashboard/passkeys", label: "Manage" } : { kind: "add-passkey", label: "Set up" },
    },
    {
      id: "session",
      title: "Active session management",
      description: "Single-device protection: a new sign-in automatically revokes the previous session.",
      icon: "devices",
      done: true,
      statusLabel: "Protected",
      action: { kind: "link", href: "/dashboard/devices", label: "Review" },
    },
    {
      id: "recovery",
      title: "Account recovery",
      description: email && phone
        ? "Two verified contact methods — you can recover access if you lose one."
        : "Add a second contact method so you can still sign in if you lose access to one.",
      icon: "lifebuoy",
      done: Boolean(email && phone),
      statusLabel: email && phone ? "Ready" : "Recommended",
      action: email && phone ? undefined : { kind: "add-contact", channel: email ? "phone" : "email", label: email ? "Add phone" : "Add email" },
    },
    {
      id: "monitoring",
      title: "Security activity",
      description: "Every sign-in, passkey change and revoked session is recorded.",
      icon: "activity",
      done: true,
      statusLabel: "Monitoring",
      action: { kind: "link", href: "/dashboard/activity", label: "View log" },
    },
  ];
}
