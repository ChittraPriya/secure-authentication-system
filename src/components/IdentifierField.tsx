"use client";

import { MailIcon, PhoneIcon } from "./icons";

export type Channel = "email" | "phone";

export function IdentifierField({
  channel,
  onChannel,
  value,
  onChange,
  error,
  disabled,
}: {
  channel: Channel;
  onChannel: (c: Channel) => void;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div role="tablist" aria-label="Contact method" className="mb-3 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {(["email", "phone"] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={channel === c}
            disabled={disabled}
            onClick={() => { onChannel(c); onChange(c === "phone" ? "+91 " : ""); }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              channel === c ? "bg-white text-indigo-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {c === "email" ? <MailIcon /> : <PhoneIcon />} {c === "email" ? "Email" : "Phone"}
          </button>
        ))}
      </div>
      <label htmlFor="identifier" className="label">{channel === "email" ? "Email address" : "Mobile number"}</label>
      <input
        id="identifier"
        className={`input ${error ? "input-error" : ""}`}
        type={channel === "email" ? "email" : "tel"}
        inputMode={channel === "email" ? "email" : "tel"}
        autoComplete={channel === "email" ? "email webauthn" : "tel webauthn"}
        placeholder={channel === "email" ? "you@example.com" : "+91 98765 43210"}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "identifier-error" : undefined}
        required
      />
      {error && <p id="identifier-error" className="error-text">{error}</p>}
    </div>
  );
}
