"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePasskeyRegistration } from "@/components/PasskeyButtons";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useShell } from "./ShellContext";

/** Dashboard-styled WebAuthn registration with toast feedback. */
export function RegisterPasskeyButton({
  label = "Set up passkey",
  variant = "primary",
  size = "md",
  className,
}: {
  label?: string;
  variant?: "primary" | "secondary" | "subtle";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { register, busy, support } = usePasskeyRegistration();
  const toast = useToast();
  const router = useRouter();
  const unsupported = support !== null && !support.supported;

  return (
    <Button
      variant={variant}
      size={size}
      icon="fingerprint"
      loading={busy}
      disabled={!support || unsupported}
      title={unsupported ? "This browser doesn't support passkeys" : undefined}
      className={className}
      onClick={async () => {
        const r = await register();
        if (r.ok) {
          toast({ tone: "success", title: "Passkey registered", description: "You can now sign in with biometrics on this device." });
          router.refresh();
        } else if (r.error) {
          toast({ tone: "danger", title: "Passkey setup didn't finish", description: r.error });
        }
      }}
    >
      {busy ? "Waiting for device…" : unsupported ? "Not supported here" : label}
    </Button>
  );
}

/** Ends this device's session after confirmation (uses the existing logout API). */
export function SignOutDeviceButton({ label = "Sign out this device" }: { label?: string }) {
  const { logout } = useShell();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" icon="logout" onClick={() => setOpen(true)} className="hover:border-danger/40 hover:text-danger-text">
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        icon="logout"
        tone="danger"
        size="sm"
        title="Sign out of this device?"
        description="Your session will end immediately. You can sign back in with a one-time code or your passkey."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={async () => { setBusy(true); await logout(); }}>Sign out</Button>
          </>
        }
      />
    </>
  );
}

/** Turns post-sign-in query flags into toasts, then cleans the URL. */
export function WelcomeToasts({ welcome, displaced }: { welcome: boolean; displaced?: string }) {
  const toast = useToast();
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || (!welcome && !displaced)) return;
    done.current = true;
    if (welcome) toast({ tone: "success", title: "Your account is ready", description: "Verified and signed in securely." });
    if (displaced) toast({ tone: "warning", title: "Previous device signed out", description: `${displaced} was signed out because you signed in here.`, duration: 7000 });
    router.replace("/dashboard", { scroll: false });
  }, [welcome, displaced, toast, router]);
  return null;
}
