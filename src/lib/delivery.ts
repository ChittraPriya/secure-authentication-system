import nodemailer from "nodemailer";

type Channel = "email" | "phone";

export type DeliveryResult = { delivered: boolean; via: "smtp" | "twilio" | "console"; devCode?: string };

const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const twilioConfigured = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

function devFallback(to: string, code: string): DeliveryResult {
  console.info(`\n[OneKey] OTP for ${to}: ${code}\n`);
  const show = process.env.NODE_ENV !== "production" && process.env.DEV_SHOW_OTP === "true";
  return { delivered: false, via: "console", devCode: show ? code : undefined };
}

export async function sendOtp(channel: Channel, to: string, code: string, purpose: "SIGNUP" | "LOGIN" | "CONTACT"): Promise<DeliveryResult> {
  const action = purpose === "SIGNUP" ? "verify your account" : purpose === "CONTACT" ? "verify this contact method" : "sign in";

  if (channel === "email" && smtpConfigured()) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to,
      subject: `${code} is your OneKey code`,
      text: `Your code to ${action} is ${code}. It expires in 5 minutes. If you didn't request this, ignore this email.`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px">
        <h2 style="margin:0 0 8px">Your OneKey code</h2>
        <p style="color:#555">Use this code to ${action}. It expires in 5 minutes.</p>
        <div style="font-size:32px;letter-spacing:10px;font-weight:700;background:#f3f4f6;border-radius:12px;padding:16px;text-align:center">${code}</div>
        <p style="color:#888;font-size:12px;margin-top:16px">Didn't request this? You can safely ignore this email.</p></div>`,
    });
    return { delivered: true, via: "smtp" };
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
    if (!res.ok) throw new Error(`SMS delivery failed (${res.status})`);
    return { delivered: true, via: "twilio" };
  }

  return devFallback(to, code);
}
