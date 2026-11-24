import { z } from "zod";

export const MIN_AGE = 13;

export function normaliseEmail(v: string) {
  return v.trim().toLowerCase();
}

/** Accepts "+91 98765 43210", "+1-202-555-0143" … and returns strict E.164. */
export function normalisePhone(v: string) {
  const digits = v.replace(/[\s\-().]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function ageOn(dob: Date, today = new Date()) {
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(50, "Too long")
  .regex(/^[\p{L}][\p{L}\p{M} '.-]*$/u, "Letters, spaces, apostrophes and hyphens only");

export const emailSchema = z.string().trim().email("Enter a valid email").max(254).transform(normaliseEmail);
export const phoneSchema = z
  .string()
  .transform(normalisePhone)
  .refine((v) => /^\+[1-9]\d{7,14}$/.test(v), "Enter a valid phone number with country code, e.g. +91 98765 43210");

export const channelSchema = z.enum(["email", "phone"]);

const identifierShape = { channel: channelSchema, identifier: z.string().min(3, "Enter your email or phone number") };

/** Validates + normalises `identifier` according to `channel`, keeping every other field. */
function withIdentifier<T extends z.ZodRawShape>(shape: T) {
  return z.object({ ...shape, ...identifierShape }).transform((v, ctx) => {
    const parsed = (v.channel === "email" ? emailSchema : phoneSchema).safeParse(v.identifier);
    if (!parsed.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["identifier"], message: parsed.error.issues[0].message });
      return z.NEVER;
    }
    return { ...v, identifier: parsed.data };
  });
}

export const identifierSchema = withIdentifier({});

export const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .transform((v) => new Date(`${v}T00:00:00.000Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date")
  .refine((d) => d.getTime() < Date.now(), "Date of birth must be in the past")
  .refine((d) => ageOn(d) >= MIN_AGE, `You must be at least ${MIN_AGE} years old`)
  .refine((d) => ageOn(d) <= 120, "Please check the year");

export const signupSchema = withIdentifier({ firstName: nameSchema, surname: nameSchema, dob: dobSchema });

export const otpVerifySchema = withIdentifier({
  purpose: z.enum(["SIGNUP", "LOGIN"]),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const otpRequestSchema = withIdentifier({ purpose: z.enum(["SIGNUP", "LOGIN"]).default("LOGIN") });

export function maskIdentifier(id: string) {
  if (id.includes("@")) {
    const [user, domain] = id.split("@");
    return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
  }
  return `${id.slice(0, 3)}${"•".repeat(Math.max(1, id.length - 5))}${id.slice(-2)}`;
}

export const profileSchema = z.object({ firstName: nameSchema, surname: nameSchema, dob: dobSchema });

export const contactVerifySchema = withIdentifier({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });
