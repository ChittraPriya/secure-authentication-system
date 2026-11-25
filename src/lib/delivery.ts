import nodemailer from "nodemailer";

type Channel = "email" | "phone";

export type DeliveryResult = { delivered: boolean; via: "smtp" | "brevo" | "twilio" | "console"; devCode?: string };

/** Thrown when a configured provider rejects the message; shown to the user as a friendly 502. */
export class DeliveryError extends Error {}

const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const brevoConfigured = () => Boolean(process.env.BREVO_API_KEY);
const twilioConfigured = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

/** Brevo sender rules: up to 11 letters/digits, or 12–15 digits. */
export function brevoSender(raw = process.env.BREVO_SMS_SENDER ?? "OneKey") {
  const clean = raw.replace(/[^A-Za-z0-9]/g, "");
  if (/^\d{12,15}$/.test(clean)) return clean;
  return clean.slice(0, 11) || "OneKey";
}

/** Brevo transactional SMS — https://developers.brevo.com/docs/transactional-sms-endpoints */
async function sendBrevoSms(to: string, text: string) {
  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: brevoSender(),
      recipient: to.replace(/^\+/, ""), // E.164 digits with country code
      content: text, // no opt-out/STOP text, so Brevo keeps it transactional
      type: "transactional",
      tag: "otp",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[OneKey] Brevo SMS failed (${res.status}): ${body.slice(0, 300)}`);
    throw new DeliveryError("We couldn't send the SMS right now. Check the number, or sign up with email instead.");
  }
}

function devFallback(to: string, code: string): DeliveryResult {
  console.info(`\n[OneKey] OTP for ${to}: ${code}\n`);
  const show = process.env.NODE_ENV !== "production" && process.env.DEV_SHOW_OTP === "true";
  return { delivered: false, via: "console", devCode: show ? code : undefined };
}

export async function sendOtp(channel: Channel, to: string, code: string, purpose: "SIGNUP" | "LOGIN" | "CONTACT"): Promise<DeliveryResult> {
  const action = purpose === "SIGNUP" ? "verify your account" : purpose === "CONTACT" ? "verify this contact method" : "sign in";

  if (channel === "email" && smtpConfigured()) {
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST!.trim(),
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.replace(/\s+/g, ""), // Gmail shows app passwords with spaces
      },
      connectionTimeout: 10_000,
    });
    try {
      await transport.sendMail({
      from: process.env.MAIL_FROM?.trim() || process.env.SMTP_USER!.trim(),
      to,
      subject: `${code} is your OneKey code`,
      text: `Your code to ${action} is ${code}. It expires in 5 minutes. If you didn't request this, ignore this email.`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px">
        <h2 style="margin:0 0 8px">Your OneKey code</h2>
        <p style="color:#555">Use this code to ${action}. It expires in 5 minutes.</p>
        <div style="font-size:32px;letter-spacing:10px;font-weight:700;background:#f3f4f6;border-radius:12px;padding:16px;text-align:center">${code}</div>
        <p style="color:#888;font-size:12px;margin-top:16px">Didn't request this? You can safely ignore this email.</p></div>`,
      });
    } catch (e) {
      const err = e as { code?: string; responseCode?: number; response?: string; message?: string };
      // Log the provider's reason (never the password) so `npm run email:test` / server logs explain it.
      console.error(`[OneKey] SMTP send failed: ${err.code ?? ""} ${err.responseCode ?? ""} ${(err.response ?? err.message ?? "").slice(0, 200)}`);
      throw new DeliveryError("We couldn't send the email right now. Please try again in a moment.");
    }
    return { delivered: true, via: "smtp" };
  }

  if (channel === "phone" && brevoConfigured()) {
    await sendBrevoSms(to, `${code} is your OneKey code to ${action}. It expires in 5 minutes. Never share it.`);
    return { delivered: true, via: "brevo" };
  }

  if (channel === "phone" && twilioConfigured()) {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: `${code} is your OneKey code to ${action}. Expires in 5 min.` }),
    });
    if (!res.ok) throw new DeliveryError("We couldn't send the SMS right now. Check the number, or sign up with email instead.");
    return { delivered: true, via: "twilio" };
  }

  return devFallback(to, code);
}
