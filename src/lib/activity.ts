import type { IconName } from "@/components/ui/Icon";
import type { Tone } from "@/components/ui/Badge";
import { describeDevice } from "./device";

export type ActivityCategory = "signin" | "passkeys" | "devices" | "alerts" | "account";

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  status: string;
  tone: Tone;
  icon: IconName;
  category: ActivityCategory;
  device: string | null;
  ip: string | null;
  at: string; // ISO
};

const map: Record<string, { title: string; status: string; tone: Tone; icon: IconName; category: ActivityCategory }> = {
  ACCOUNT_CREATED: { title: "Account created and verified", status: "Created", tone: "accent", icon: "sparkles", category: "account" },
  LOGIN_OTP: { title: "Signed in with one-time code", status: "Success", tone: "success", icon: "login", category: "signin" },
  LOGIN_PASSKEY: { title: "Signed in with passkey", status: "Success", tone: "success", icon: "fingerprint", category: "signin" },
  OTP_FAILED: { title: "Incorrect verification code", status: "Failed", tone: "danger", icon: "alertCircle", category: "alerts" },
  PASSKEY_ADDED: { title: "Passkey registered", status: "Added", tone: "accent", icon: "fingerprint", category: "passkeys" },
  PASSKEY_REMOVED: { title: "Passkey removed", status: "Removed", tone: "warning", icon: "trash", category: "passkeys" },
  PASSKEY_RENAMED: { title: "Passkey renamed", status: "Updated", tone: "neutral", icon: "pencil", category: "passkeys" },
  DEVICE_REPLACED: { title: "Previous session revoked", status: "Revoked", tone: "warning", icon: "devices", category: "devices" },
  LOGOUT: { title: "Signed out", status: "Ended", tone: "neutral", icon: "logout", category: "signin" },
  PROFILE_UPDATED: { title: "Profile updated", status: "Updated", tone: "neutral", icon: "user", category: "account" },
  CONTACT_ADDED: { title: "Contact method verified", status: "Verified", tone: "success", icon: "mail", category: "account" },
};

export function toActivityItem(e: { id: string; type: string; detail: string | null; ip: string | null; userAgent: string | null; createdAt: Date }): ActivityItem {
  const m = map[e.type] ?? { title: e.type, status: "Info", tone: "neutral" as Tone, icon: "info" as IconName, category: "account" as ActivityCategory };
  return {
    id: e.id,
    type: e.type,
    ...m,
    // Failed-code messages are internal; show a neutral explanation instead.
    detail: e.type === "OTP_FAILED" ? "Someone entered a wrong code for your account" : e.detail,
    device: e.userAgent ? describeDevice(e.userAgent) : null,
    ip: e.ip,
    at: e.createdAt.toISOString(),
  };
}

export const activityFilters: { id: "all" | ActivityCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "signin", label: "Sign-ins" },
  { id: "passkeys", label: "Passkeys" },
  { id: "devices", label: "Sessions" },
  { id: "account", label: "Account" },
  { id: "alerts", label: "Alerts" },
];
