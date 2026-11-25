// Checks your SMTP settings and sends one test email.
// Usage:  npm run email:test -- you@example.com
// Reads .env (Node's --env-file). Never prints your password.
import nodemailer from "nodemailer";

const to = process.argv.slice(2).find((a) => !a.startsWith("--"));
const env = (k) => (process.env[k] ?? "").trim();
const host = env("SMTP_HOST");
const port = Number(env("SMTP_PORT") || 465);
const user = env("SMTP_USER");
const pass = (process.env.SMTP_PASS ?? "").replace(/\s+/g, "");
const from =
  env("MAIL_FROM") ||
  (env("SMTP_FROM") ? (env("SMTP_FROM_NAME") ? `"${env("SMTP_FROM_NAME")}" <${env("SMTP_FROM")}>` : env("SMTP_FROM")) : user);
const verifyOnly = process.argv.includes("--verify-only");

const fail = (msg, hint) => {
  console.error(`\n✖ ${msg}`);
  if (hint) console.error(`  → ${hint}`);
  process.exit(1);
};

console.log("\nOneKey email check");
console.log(`  host: ${host || "(not set)"}  port: ${port}  user: ${user ? user.replace(/^(.{2}).*(@.*)$/, "$1***$2") : "(not set)"}  password: ${pass ? "set" : "(not set)"}`);

if (!host || !user || !pass) {
  fail(
    "SMTP is not configured.",
    "Open .env, remove the # at the start of the SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM lines, and fill in your real values.",
  );
}
if (/example\.com|app-password/.test(user + pass + from)) {
  fail("SMTP values still contain the example placeholders.", "Replace you@example.com / app-password with your real details.");
}
if (!to && !verifyOnly) fail("No recipient given.", "Run: npm run email:test -- your-address@gmail.com");

const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 10_000 });

const hints = {
  EAUTH: /gmail/i.test(host)
    ? "Gmail rejected the login. Use a 16-character App Password (myaccount.google.com/apppasswords, needs 2-Step Verification), not your normal Gmail password."
    : /brevo|sendinblue/i.test(host)
      ? "Brevo rejected the login. SMTP_USER must be the 'Login' shown on Brevo → SMTP & API → SMTP tab (often like 8xxxxx001@smtp-brevo.com), and SMTP_PASS must be an SMTP key from that tab — not your Brevo account password or API key."
      : "Username or password is wrong for this SMTP server.",
  ESOCKET: "Couldn't open a secure connection. Use port 465 for Gmail, or 587 for Brevo (and check the host name).",
  ETIMEDOUT: "Connection timed out. Your network or firewall may block this port — try 587 instead of 465 (or the other way round).",
  ECONNECTION: "Couldn't reach the server. Check SMTP_HOST and SMTP_PORT, and your internet connection.",
  EDNS: "Host name not found. Check SMTP_HOST for typos (smtp.gmail.com or smtp-relay.brevo.com).",
};

try {
  process.stdout.write("  1/2 Logging in to SMTP server… ");
  await transport.verify();
  console.log("ok");
  console.log(`  sender: ${from.replace(/[^<\s"]{2}[^@<]*@/, (m) => m.slice(0, 2) + "***@")}`);
  if (verifyOnly) {
    console.log("\n✔ Login works (no email sent: --verify-only).");
    process.exit(0);
  }
  process.stdout.write(`  2/2 Sending test email to ${to}… `);
  const info = await transport.sendMail({
    from,
    to,
    subject: "OneKey test email",
    text: "If you can read this, OneKey can send sign-in codes by email.",
  });
  console.log("ok");
  console.log(`\n✔ Sent (id ${info.messageId}). Check the inbox — and the Spam folder the first time.`);
  if (/brevo/i.test(host)) console.log("  Brevo note: MAIL_FROM must be a sender verified in Brevo → Senders, Domains & Dedicated IPs.");
} catch (e) {
  console.log("failed");
  const reason = e.response || e.message;
  const hint =
    (/unauthori[sz]ed ip/i.test(reason)
      ? "Brevo is blocking this computer's IP address. In Brevo go to Settings → Security → Authorised IPs, then authorise this IP (or turn off IP blocking), and run this test again."
      : undefined) ??
    hints[e.code] ??
    (/sender|from/i.test(reason) ? "The sender address isn't allowed. Set MAIL_FROM to an address this account may send from (for Brevo: a verified sender)." : undefined);
  fail(`${e.code ?? "Error"}: ${String(reason).slice(0, 200)}`, hint);
}
