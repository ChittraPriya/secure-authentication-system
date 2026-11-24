"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

const HEARTBEAT_MS = 5000;

/**
 * Single-device enforcement on the client: polls /api/session/status (and re-checks on focus / reconnect).
 * When another device signs in, the server has already revoked this session — we tell the user within ~5s.
 */
export function SessionWatcher() {
  const router = useRouter();
  const [revoked, setRevoked] = useState<{ replacedBy: string | null } | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    async function check() {
      if (stopped.current || document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/session/status", { cache: "no-store" });
        const data = await res.json();
        if (data.status === "revoked") {
          stopped.current = true;
          setRevoked({ replacedBy: data.replacedBy });
        } else if (data.status === "none") {
          stopped.current = true;
          router.replace("/login");
        }
      } catch { /* offline — retry next tick */ }
    }
    const t = setInterval(check, HEARTBEAT_MS);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", check);
    };
  }, [router]);

  const by = revoked?.replacedBy ?? "another device";
  const signIn = () => router.replace(`/login?replaced=${encodeURIComponent(by)}`);

  return (
    <Dialog
      open={Boolean(revoked)}
      onClose={signIn}
      icon="devices"
      tone="warning"
      size="sm"
      title="Signed in on another device"
      description={<>Your account was just signed in on <b className="font-semibold text-fg">{by}</b>, so this session has been ended. Only one device can be active at a time.</>}
      footer={<Button variant="primary" className="w-full" onClick={signIn}>Sign in again</Button>}
    >
      <p className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[13px] text-fg-muted">Wasn&apos;t you? Sign in again to take back control — that will sign the other device out.</p>
    </Dialog>
  );
}
