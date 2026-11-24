"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { useShell, type Theme } from "@/components/dashboard/ShellContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";

const themes: { id: Theme; label: string; icon: IconName }[] = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
  { id: "system", label: "System", icon: "monitor" },
];

function ThemePreview({ id }: { id: Theme }) {
  const pane = (dark: boolean) => (
    <div className={cn("flex h-full w-full gap-1.5 p-2", dark ? "bg-[#101117]" : "bg-[#f8f9fb]")}>
      <div className={cn("w-5 rounded", dark ? "bg-[#1f212b]" : "bg-white ring-1 ring-black/5")} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={cn("h-2 w-2/3 rounded-full", dark ? "bg-[#2a2c3a]" : "bg-[#e5e7ed]")} />
        <div className={cn("flex-1 rounded", dark ? "bg-[#1f212b]" : "bg-white ring-1 ring-black/5")}>
          <div className="m-1.5 h-1.5 w-1/2 rounded-full bg-[#5b4cf0]" />
        </div>
      </div>
    </div>
  );
  if (id === "system") {
    return (
      <div className="relative h-full w-full">
        {pane(false)}
        <div className="absolute inset-0" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}>{pane(true)}</div>
      </div>
    );
  }
  return pane(id === "dark");
}

export function SettingsPanel() {
  const { theme, setTheme, collapsed, setCollapsed, reduceMotion, setReduceMotion } = useShell();
  const toast = useToast();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deleteAccount() {
    setBusy(true); setError("");
    const r = await api("/api/account", { confirm }, "DELETE");
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Appearance" description="Choose a theme. System follows your device setting." icon="palette" />
        <CardBody>
          <div role="radiogroup" aria-label="Theme" className="grid max-w-xl grid-cols-3 gap-3">
            {themes.map((t) => {
              const selected = theme === t.id;
              return (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={(e) => { setTheme(t.id, { x: e.clientX, y: e.clientY }); toast({ tone: "neutral", title: `${t.label} theme applied` }); }}
                  className={cn(
                    "group rounded-xl border p-1.5 text-left outline-none transition duration-200 focus-visible:ring-4 focus-visible:ring-accent/25",
                    selected ? "border-accent ring-2 ring-accent/20" : "border-line hover:border-line-strong",
                  )}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-line transition-transform duration-300 group-hover:scale-[1.02]">
                    <ThemePreview id={t.id} />
                  </div>
                  <div className="flex items-center justify-between px-1 pb-0.5 pt-2">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-fg"><Icon name={t.icon} className="h-3.5 w-3.5 text-fg-subtle" />{t.label}</span>
                    <span className={cn("grid h-4 w-4 place-items-center rounded-full border transition", selected ? "border-accent bg-accent text-white" : "border-line-strong")}>
                      {selected && <Icon name="check" className="h-2.5 w-2.5 animate-pop" strokeWidth={3.5} />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Interface" description="Layout and motion preferences are saved on this device." icon="settings" />
        <CardBody className="divide-y divide-line py-0">
          <SettingRow title="Collapse sidebar" description="Show icons only to give content more room. Shortcut: [" control={<Switch label="Collapse sidebar" checked={collapsed} onChange={setCollapsed} />} />
          <SettingRow title="Reduce motion" description="Turn off animations and transitions. Your OS setting is always respected too." control={<Switch label="Reduce motion" checked={reduceMotion} onChange={setReduceMotion} />} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notifications" description="Email alerts for important security events." icon="bell" action={<Badge tone="neutral">Coming soon</Badge>} />
        <CardBody className="divide-y divide-line py-0">
          <SettingRow title="New device sign-in" description="Email me when my account is signed in on a different device." control={<Switch label="New device sign-in alerts (coming soon)" checked={false} onChange={() => {}} disabled />} />
          <SettingRow title="Passkey changes" description="Email me when a passkey is added or removed." control={<Switch label="Passkey change alerts (coming soon)" checked={false} onChange={() => {}} disabled />} />
          <p className="py-3 text-xs text-fg-subtle">Security events already appear in the bell menu and your activity log in real time.</p>
        </CardBody>
      </Card>

      <Card className="border-danger/30">
        <CardHeader title="Danger zone" description="Irreversible actions for your account." icon="alertTriangle" />
        <CardBody>
          <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Delete account</p>
              <p className="mt-0.5 text-[13px] text-fg-muted">Permanently removes your profile, passkeys, sessions and activity history.</p>
            </div>
            <Button variant="danger" icon="trash" onClick={() => { setDeleteOpen(true); setConfirm(""); setError(""); }}>Delete account</Button>
          </div>
        </CardBody>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        icon="alertTriangle"
        tone="danger"
        title="Delete your account?"
        description="This can't be undone. Your profile, passkeys, sessions and security history will be permanently deleted."
        footer={
          <>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={busy} disabled={confirm !== "DELETE"} onClick={deleteAccount}>Delete permanently</Button>
          </>
        }
      >
        <label htmlFor="confirm-delete" className="label">Type <span className="font-mono font-semibold">DELETE</span> to confirm</label>
        <input id="confirm-delete" data-autofocus className={cn("input font-mono", error && "input-error")} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        {error && <p className="error-text">{error}</p>}
      </Dialog>
    </div>
  );
}

function SettingRow({ title, description, control }: { title: string; description: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>
      </div>
      {control}
    </div>
  );
}
