# Secure Authentication System

**OneKey** — passwordless authentication with biometrics and single-device sessions.

A modern, secure authentication app built with Next.js 15 (App Router) and TypeScript. It provides:

| Requirement | Implementation |
|---|---|
| Sign up with **email or phone** | Tabbed input; email normalised to lowercase, phone normalised to E.164 (`+919876543210`) |
| Collect **DOB and surname** | First name, surname (Unicode-aware validation), DOB with age check (13–120) |
| Login by **6-digit code** | Secure OTP via email (SMTP: Gmail or Brevo) or SMS (Brevo or Twilio), with a dev-mode fallback |
| Login by **Face ID / biometrics** | WebAuthn **passkeys**: Face ID, Touch ID, Windows Hello, Android fingerprint |
| **One active device** | Server-side sessions; a new login revokes the old one, and the old device is notified live |

---

## Quick start

```bash
npm install
cp .env.example .env        # then set SESSION_SECRET and OTP_PEPPER to long random strings
npx prisma db push          # creates the SQLite database
npm run dev                 # http://localhost:3000
npm test                    # unit tests (Vitest)
npm run email:test -- you@example.com   # check SMTP settings and send a test email
```

With no SMTP, Brevo or Twilio credentials, the app runs in **dev mode**. The code prints in the server console and appears in a yellow banner on the verify screen, so reviewers can try every flow without any setup.

> **Biometrics need a secure context.** `localhost` works. To try Face ID on a real phone, deploy it (e.g. Vercel + Postgres) or tunnel it over HTTPS (`ngrok http 3000`).

---

## How it works

### 1. Sign-up → verify → (optional) enable Face ID
```
[Details form] --POST /api/auth/signup--> user row (unverified) + OTP sent
[6-digit code] --POST /api/auth/otp/verify--> user.verifiedAt set, session created
[Enable Face ID] --WebAuthn registration--> passkey stored (public key only)
```
An unverified account can be re-submitted (e.g. after a typo). A verified one returns *"Account exists, sign in instead"*.

### 2. Login with a 6-digit code
* `POST /api/auth/otp/request` returns the **same response whether or not the account exists**, which prevents user enumeration.
* Codes come from `crypto.randomInt`, are valid for **5 minutes**, and are **single use** (consumed atomically, so two parallel requests can't both use one code).
* Only an **HMAC-SHA256(code + identifier + purpose, pepper)** is stored. A leaked database reveals no codes, and a hash can't be replayed for another user or purpose.
* Codes are compared with `timingSafeEqual`. After **5 wrong attempts** the code is burned.
* There's a **30 s resend cooldown**, **5 codes per hour** per identifier, and a per-IP rate limit on every endpoint.
* The UI has six boxes with auto-advance, paste support, SMS autofill (`autocomplete="one-time-code"`), auto-submit, and expiry/resend countdowns.

### 3. Login with Face ID / biometrics (WebAuthn passkeys)
* Built on `@simplewebauthn/server` and `@simplewebauthn/browser`.
* **Discoverable credentials** (`residentKey: required`) give true one-tap sign-in. The user doesn't type an email; the OS shows the passkey and unlocks it with their face or finger.
* `userVerification: required` means the biometric or device PIN check is mandatory.
* **The biometric never leaves the device.** The server stores only a public key and verifies a signature over a random challenge. That makes it **phishing-resistant**, because the credential is bound to the site's domain.
* Challenges are stored in a signed, 5-minute, httpOnly cookie and consumed once.
* The **signature counter** is checked and updated, which helps detect cloned authenticators.
* Users can register several devices, see when each was last used, and remove them.

### 4. One active device
```
Device A (active) ─────────────┐
                               │   Device B logs in
                               ▼
  createSession() in ONE DB transaction:
     1. UPDATE sessions SET revokedAt=now, reason='SIGNED_IN_ELSEWHERE', replacedBy='Safari on iPhone'
        WHERE userId=? AND revokedAt IS NULL
     2. INSERT new session for Device B
  ─────────────────────────────────────────
Device A heartbeat (every 5 s + on tab focus) → GET /api/session/status → "revoked"
   → modal: "Your account was signed in on Safari on iPhone. This device has been signed out."
```
* The session cookie is an HS256 JWT that holds only the session ID. **Every request validates the JWT *and* the database row**, so a still-valid token from a displaced device is rejected immediately.
* A per-browser device ID cookie tells a new device apart from the same browser signing in again. Only a real device change is logged as `DEVICE_REPLACED`.
* The new device sees a banner naming the device it signed out.

### 5. Security activity log
The dashboard lists recent events: account created, logins (code or biometrics), failed codes, passkeys added or removed, and devices replaced.

---

## Security checklist
- Passwordless: no passwords to leak or reuse
- OTP is HMAC-hashed with a pepper, plus expiry, attempt limits, single use, timing-safe compare
- No user enumeration on login
- Rate limiting per IP (all routes) and per identifier (OTP sends)
- httpOnly, `SameSite=Lax`, `Secure`-in-production cookies, plus an Origin check on every POST (CSRF)
- Server-side session revocation (JWT alone is never trusted)
- WebAuthn with mandatory user verification and counter checks
- Security headers: `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy
- Zod validation on every input; errors map to the right form field

## Project structure
```
prisma/schema.prisma          User, OtpCode, Session, Passkey, SecurityEvent
src/lib/
  otp.ts                      code generation, hashing, issue/verify with limits
  session.ts                  single-device session creation and validation
  webauthn.ts                 relying-party config and challenge cookie
  delivery.ts                 SMTP / Brevo SMS / Twilio / dev-console delivery
  validation.ts               zod schemas, phone/email normalisation, age
  http.ts, rate-limit.ts      route wrapper: origin check, rate limit, errors
src/app/api/...               REST endpoints (signup, otp, passkey, session, logout)
src/app/(signup|login|dashboard)  UI
src/components/               OtpInput, OtpStep, PasskeyButtons, IdentifierField
src/lib/__tests__/            Vitest unit tests
```

## Production notes
* Change `provider` in `prisma/schema.prisma` to `postgresql` (Neon, Supabase, Railway) for serverless hosting.
* Set `SMTP_*` (e.g. a Gmail app password or Brevo SMTP key) and `BREVO_API_KEY` (or `TWILIO_*`) for real delivery. `DEV_SHOW_OTP` is ignored in production.
* Replace the in-memory rate limiter with Redis (Upstash) when running more than one instance.
* Possible next steps: push notifications to the old device (WebSocket/SSE), a "this wasn't me" email when a device is replaced, a TOTP authenticator app, and account recovery.

## Tech stack
Next.js 15 · React 19 · TypeScript · Tailwind CSS · Prisma (SQLite/Postgres) · SimpleWebAuthn · jose (JWT) · Zod · Nodemailer · Vitest

## Author

Chittra Priya K
