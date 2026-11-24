"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { RegisterPasskeyButton } from "@/components/dashboard/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { EmptyState, RelativeTime } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { buttonClass } from "@/components/ui/Button";
import { fmtDate } from "@/lib/format";

type PK = { id: string; nickname: string; synced: boolean; deviceType: string; createdAt: string; lastUsedAt: string | null };

export function PasskeyManager({ passkeys }: { passkeys: PK[] }) {
  const router = useRouter();
  const toast = useToast();
  const [renaming, setRenaming] = useState<PK | null>(null);
  const [removing, setRemoving] = useState<PK | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function rename() {
    if (!renaming) return;
    setBusy(true); setError("");
    const r = await api(`/api/passkeys/${encodeURIComponent(renaming.id)}`, { nickname: name }, "PATCH");
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast({ tone: "success", title: "Passkey renamed" });
    setRenaming(null);
    router.refresh();
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    const r = await api(`/api/passkeys/${encodeURIComponent(removing.id)}`, undefined, "DELETE");
    setBusy(false);
    if (!r.ok) return toast({ tone: "danger", title: "Couldn't remove passkey", description: r.error });
    toast({ tone: "neutral", title: "Passkey removed", description: `${removing.nickname} can no longer sign in.` });
    setRemoving(null);
    router.refresh();
  }

  if (!passkeys.length) {
    return (
      <EmptyState
        icon="fingerprint"
        title="Sign in with a glance"
        description="Register this device's Face ID, Touch ID, Windows Hello or fingerprint. It takes about five seconds."
        action={<RegisterPasskeyButton label="Set up passkey" />}
      />
    );
  }

  return (
    <>
      <ul className="stagger divide-y divide-line rounded-xl border border-line">
        {passkeys.map((pk) => (
          <li key={pk.id} className="group flex items-center gap-4 bg-surface px-4 py-3.5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-surface-2/50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent-soft text-accent-text transition-transform duration-300 group-hover:scale-105">
              <Icon name="fingerprint" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-fg">{pk.nickname}</p>
                {pk.synced ? (
                  <Badge tone="accent"><Icon name="cloud" className="h-3 w-3" /> Synced</Badge>
                ) : (
                  <Badge tone="neutral">This device only</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-fg-subtle">
                Added {fmtDate(new Date(pk.createdAt))} · {pk.lastUsedAt ? <>Last used <RelativeTime iso={pk.lastUsedAt} /></> : "Never used to sign in"}
              </p>
            </div>
            <Menu
              label={`Actions for ${pk.nickname}`}
              triggerClassName={buttonClass("ghost", "icon-sm")}
              panelClassName="w-48"
              button={() => <Icon name="more" className="h-4 w-4" />}
            >
              <MenuItem icon="pencil" onSelect={() => { setRenaming(pk); setName(pk.nickname); setError(""); }}>Rename</MenuItem>
              <MenuSeparator />
              <MenuItem icon="trash" danger onSelect={() => setRemoving(pk)}>Remove</MenuItem>
            </Menu>
          </li>
        ))}
      </ul>

      <Dialog
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        icon="pencil"
        title="Rename passkey"
        description="Pick a name that helps you recognise the device."
        footer={<><Button onClick={() => setRenaming(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={rename} disabled={!name.trim()}>Save</Button></>}
      >
        <form onSubmit={(e) => { e.preventDefault(); rename(); }}>
          <label htmlFor="pk-name" className="label">Name</label>
          <input id="pk-name" data-autofocus className={`input ${error ? "input-error" : ""}`} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Dialog>

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        icon="trash"
        tone="danger"
        size="sm"
        title={`Remove “${removing?.nickname ?? ""}”?`}
        description="You won't be able to sign in with this passkey any more. You can always register it again."
        footer={<><Button onClick={() => setRemoving(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={remove}>Remove passkey</Button></>}
      />
    </>
  );
}
