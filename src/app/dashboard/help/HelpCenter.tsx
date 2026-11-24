"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useShell } from "@/components/dashboard/ShellContext";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useIsMac } from "@/components/ui/hooks";

const faqs = [
  { q: "Why can only one device be signed in?", a: "It stops account sharing and session hijacking. When you sign in on a new device, the previous session is revoked on the server immediately, and the old device shows a notice within about five seconds." },
  { q: "Is my Face ID or fingerprint sent to OneKey?", a: "No. Passkeys use WebAuthn: your device checks your biometric locally and signs a challenge with a private key that never leaves it. We only store the matching public key." },
  { q: "My code didn't arrive. What can I do?", a: "Codes expire after 5 minutes. Wait for the resend timer (30 seconds) and request a new one. Check spam folders for email codes. After 5 codes in an hour, requests pause for security." },
  { q: "I got signed out unexpectedly.", a: "That means your account was signed in on another device. If it wasn't you, sign in again right away — that revokes the other session — then review Login Activity." },
  { q: "How do I add a phone number or email?", a: "Go to Profile → Contact methods, or use the Security checklist. We send a code to confirm it's yours before it's added. A second contact also acts as account recovery." },
  { q: "Can I use a passkey on several devices?", a: "Yes. Register a passkey on each device you use. Synced passkeys (e.g. iCloud Keychain, Google Password Manager) also work across your devices automatically." },
];

export function HelpCenter() {
  const { openCommand } = useShell();
  const isMac = useIsMac();
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const list = useMemo(() => faqs.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase().trim())), [q]);
  const mod = isMac ? "⌘" : "Ctrl";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader title="Frequently asked questions" icon="book" />
        <CardBody>
          <div className="relative mb-4">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles…" className="input pl-9" aria-label="Search help" />
          </div>
          {list.length === 0 && <p className="py-6 text-center text-sm text-fg-muted">No answers match “{q}”.</p>}
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {list.map((f, i) => {
              const expanded = open === i;
              return (
                <div key={f.q} className="bg-surface">
                  <button
                    onClick={() => setOpen(expanded ? null : i)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium text-fg outline-none transition-colors hover:bg-surface-2/60 focus-visible:bg-surface-2"
                  >
                    {f.q}
                    <Icon name="chevronDown" className={cn("h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-300 ease-spring", expanded && "rotate-180")} />
                  </button>
                  {/* grid-rows trick animates height to auto */}
                  <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className={cn("px-4 pb-4 text-[13px] leading-6 text-fg-muted transition-opacity duration-300", expanded ? "opacity-100" : "opacity-0")}>{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Keyboard shortcuts" icon="keyboard" />
          <CardBody className="space-y-2.5">
            {[
              ["Open command menu", [mod, "K"]],
              ["Toggle sidebar", ["["]],
              ["Navigate menus", ["↑", "↓"]],
              ["Close dialogs", ["Esc"]],
            ].map(([label, keys]) => (
              <div key={label as string} className="flex items-center justify-between text-[13px]">
                <span className="text-fg-muted">{label as string}</span>
                <span className="flex gap-1">{(keys as string[]).map((k) => <kbd key={k} className="kbd">{k}</kbd>)}</span>
              </div>
            ))}
            <Button size="sm" className="mt-2 w-full" icon="command" onClick={openCommand}>Try the command menu</Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick links" icon="arrowUpRight" />
          <CardBody className="space-y-1">
            {[
              ["/dashboard/activity", "Review login activity", "activity"],
              ["/dashboard/devices", "Manage active session", "devices"],
              ["/dashboard/passkeys", "Set up a passkey", "fingerprint"],
            ].map(([href, label, icon]) => (
              <Link key={href} href={href} className={buttonClass("ghost", "md", "group w-full justify-start")}>
                <Icon name={icon as "activity"} className="h-4 w-4" /> <span className="flex-1 text-left">{label}</span>
                <Icon name="arrowRight" className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Contact support" icon="message" action={<Badge tone="neutral">Coming soon</Badge>} />
          <CardBody>
            <p className="text-[13px] leading-5 text-fg-muted">Live chat and ticketing aren&apos;t available in this build yet.</p>
            <Button size="sm" className="mt-3 w-full" disabled icon="message">Start a conversation</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
