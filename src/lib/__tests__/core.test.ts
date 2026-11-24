import { beforeAll, describe, expect, it } from "vitest";
import { generateCode, hashCode, safeEqualHex } from "../otp";
import { ageOn, dobSchema, maskIdentifier, phoneSchema, signupSchema } from "../validation";
import { describeDevice } from "../device";

beforeAll(() => {
  process.env.OTP_PEPPER = "test-pepper-test-pepper-test-pepper";
});

describe("OTP", () => {
  it("always generates exactly 6 digits", () => {
    for (let i = 0; i < 2000; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("hash is bound to identifier and purpose", () => {
    const a = hashCode("123456", "a@b.com", "LOGIN");
    expect(safeEqualHex(a, hashCode("123456", "a@b.com", "LOGIN"))).toBe(true);
    expect(safeEqualHex(a, hashCode("123456", "c@d.com", "LOGIN"))).toBe(false);
    expect(safeEqualHex(a, hashCode("123456", "a@b.com", "SIGNUP"))).toBe(false);
    expect(safeEqualHex(a, hashCode("654321", "a@b.com", "LOGIN"))).toBe(false);
  });
});

describe("validation", () => {
  it("normalises phone numbers to E.164", () => {
    expect(phoneSchema.parse("+91 98765-43210")).toBe("+919876543210");
    expect(phoneSchema.safeParse("12").success).toBe(false);
  });

  it("enforces minimum age and past dates", () => {
    const tooYoung = new Date();
    tooYoung.setFullYear(tooYoung.getFullYear() - 10);
    expect(dobSchema.safeParse(tooYoung.toISOString().slice(0, 10)).success).toBe(false);
    expect(dobSchema.safeParse("2999-01-01").success).toBe(false);
    expect(dobSchema.safeParse("2000-02-29").success).toBe(true);
  });

  it("computes age around birthdays correctly", () => {
    expect(ageOn(new Date("2000-06-15"), new Date("2025-06-14"))).toBe(24);
    expect(ageOn(new Date("2000-06-15"), new Date("2025-06-15"))).toBe(25);
  });

  it("parses a full sign-up payload", () => {
    const r = signupSchema.parse({ firstName: "Priya", surname: "O'Neil-Kumar", dob: "1999-04-12", channel: "email", identifier: " Priya@Example.COM " });
    expect(r.identifier).toBe("priya@example.com");
    expect(signupSchema.safeParse({ firstName: "P1", surname: "K", dob: "1999-04-12", channel: "email", identifier: "x@y.z" }).success).toBe(false);
  });

  it("masks identifiers", () => {
    expect(maskIdentifier("priya@example.com")).toBe("pr•••@example.com");
    expect(maskIdentifier("+919876543210")).toBe("+91••••••••10");
  });
});

describe("device labels", () => {
  it("describes common user agents", () => {
    expect(describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe("Safari on iPhone");
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0")).toBe("Edge on Windows");
    expect(describeDevice("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36")).toBe("Chrome on Android");
  });
});
