import { db } from "./db";

export type SecurityEventType =
  | "ACCOUNT_CREATED"
  | "LOGIN_OTP"
  | "LOGIN_PASSKEY"
  | "OTP_FAILED"
  | "PASSKEY_ADDED"
  | "PASSKEY_REMOVED"
  | "DEVICE_REPLACED"
  | "LOGOUT"
  | "PROFILE_UPDATED"
  | "CONTACT_ADDED"
  | "PASSKEY_RENAMED";

export async function logEvent(userId: string, type: SecurityEventType, req?: Request, detail?: string) {
  await db.securityEvent.create({
    data: {
      userId,
      type,
      detail,
      ip: req?.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
      userAgent: req?.headers.get("user-agent") ?? null,
    },
  });
}
