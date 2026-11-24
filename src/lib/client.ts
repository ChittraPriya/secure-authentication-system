"use client";

export type ApiResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; field?: string; code?: string; retryAfter?: number };

export async function api<T = Record<string, unknown>>(url: string, body?: unknown, method = "POST"): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? `Request failed (${res.status})`, ...data };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Check your connection." };
  }
}

/** Maps WebAuthn DOMExceptions to friendly copy. */
export function webauthnError(e: unknown) {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError") return "Cancelled or timed out. Try again when you're ready.";
  if (name === "InvalidStateError") return "This device is already set up for Face ID / biometrics.";
  if (name === "SecurityError") return "Biometrics need HTTPS (or localhost).";
  if (name === "NotSupportedError") return "This browser doesn't support passkeys.";
  return (e as Error)?.message || "Biometric request failed.";
}
