"use client";

import { useEffect, useRef } from "react";

/** Six separate boxes with auto-advance, backspace navigation, paste support and SMS autofill. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => { if (invalid) refs.current[Math.min(value.length, 5)]?.focus(); }, [invalid, value.length]);

  function set(next: string, focusIndex: number) {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    refs.current[Math.min(focusIndex, 5)]?.focus();
    if (clean.length === 6) onComplete?.(clean);
  }

  return (
    <div className={`flex justify-between gap-2 ${invalid ? "animate-shake" : ""}`} role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? 6 : 1}
          aria-label={`Digit ${i + 1}`}
          className={`h-14 w-full rounded-xl border bg-surface text-center text-2xl font-semibold text-fg outline-none transition
            focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60
            ${invalid ? "border-danger" : d ? "border-accent/50" : "border-line-strong"}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) return set(v, v.length); // paste / OS autofill into one box
            const arr = digits.slice();
            arr[i] = v;
            set(arr.join(""), v ? i + 1 : i);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              const arr = digits.slice();
              arr[i - 1] = "";
              set(arr.join(""), i - 1);
              e.preventDefault();
            }
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const p = e.clipboardData.getData("text").replace(/\D/g, "");
            if (p) set(p, p.length);
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
