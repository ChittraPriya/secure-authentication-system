import { afterEach, describe, expect, it, vi } from "vitest";
import { brevoSender, DeliveryError, sendOtp } from "../delivery";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Brevo SMS", () => {
  it("normalises the sender name to Brevo's rules", () => {
    expect(brevoSender("OneKey")).toBe("OneKey");
    expect(brevoSender("One Key Auth!")).toBe("OneKeyAuth");
    expect(brevoSender("VeryLongSenderName")).toBe("VeryLongSen");
    expect(brevoSender("919876543210")).toBe("919876543210");
    expect(brevoSender("!!!")).toBe("OneKey");
  });

  it("posts a transactional SMS to the Brevo API", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: 1 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const r = await sendOtp("phone", "+919876543210", "123456", "LOGIN");

    expect(r).toEqual({ delivered: true, via: "brevo" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/transactionalSMS/send");
    expect(init.headers["api-key"]).toBe("test-key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ sender: "OneKey", recipient: "919876543210", type: "transactional" });
    expect(body.content).toContain("123456");
    expect(body.content.toLowerCase()).not.toContain("stop"); // would force "marketing"
  });

  it("raises a friendly DeliveryError when Brevo rejects the request", async () => {
    vi.stubEnv("BREVO_API_KEY", "bad-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"code":"unauthorized"}', { status: 401 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sendOtp("phone", "+919876543210", "123456", "LOGIN")).rejects.toBeInstanceOf(DeliveryError);
  });

  it("falls back to dev mode when no provider is configured", async () => {
    vi.stubEnv("BREVO_API_KEY", "");
    vi.spyOn(console, "info").mockImplementation(() => {});
    const r = await sendOtp("phone", "+919876543210", "654321", "SIGNUP");
    expect(r.via).toBe("console");
  });
});
