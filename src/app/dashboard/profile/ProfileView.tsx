"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { fmtDate } from "@/lib/format";
import { ageOn, MIN_AGE } from "@/lib/validation";
import { AddContactDialog } from "@/components/dashboard/AddContactDialog";
import { Avatar } from "@/components/dashboard/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";

type User = { firstName: string; surname: string; dob: string; email: string | null; phone: string | null; createdAt: string; initials: string; passkeys: number };
type Errors = Partial<Record<"firstName" | "surname" | "dob", string>>;

const maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - MIN_AGE); return d.toISOString().slice(0, 10); })();

export function ProfileView({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();
  const initial = { firstName: user.firstName, surname: user.surname, dob: user.dob };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<"email" | "phone" | null>(null);
  const dirty = form.firstName !== initial.firstName || form.surname !== initial.surname || form.dob !== initial.dob;
  const age = useMemo(() => (form.dob ? ageOn(new Date(`${form.dob}T00:00:00Z`)) : null), [form.dob]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({});
    const r = await api<{ changed: string[] }>("/api/profile", form, "PATCH");
    setBusy(false);
    if (!r.ok) {
      const f = r.field as keyof Errors | undefined;
      if (f && ["firstName", "surname", "dob"].includes(f)) setErrors({ [f]: r.error });
      else toast({ tone: "danger", title: "Couldn't save profile", description: r.error });
      return;
    }
    toast({ tone: "success", title: "Profile updated", description: r.changed.length ? `Saved ${r.changed.join(", ")}.` : "No changes." });
    router.refresh();
  }

  const field = (key: keyof Errors, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={key} className="label">{label}</label>
      <input
        id={key}
        className={cn("input", errors[key] && "input-error")}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        aria-invalid={Boolean(errors[key])}
        {...props}
      />
      {errors[key] && <p className="error-text">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="relative h-fit overflow-hidden">
        <div aria-hidden className="h-20 bg-gradient-to-br from-accent/25 via-accent/10 to-fuchsia-400/10" />
        <div className="-mt-8 px-5 pb-5">
          <div className="animate-pop"><Avatar initials={user.initials} size="xl" /></div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-fg">{user.firstName} {user.surname}</p>
          <p className="truncate text-sm text-fg-muted">{user.email ?? user.phone}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="success" dot>Verified</Badge>
            {user.passkeys > 0 && <Badge tone="accent"><Icon name="fingerprint" className="h-3 w-3" /> Passkey</Badge>}
          </div>
          <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[13px]">
            <div className="flex justify-between gap-3"><dt className="text-fg-subtle">Member since</dt><dd className="font-medium text-fg">{fmtDate(new Date(user.createdAt))}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-fg-subtle">Contact methods</dt><dd className="font-medium text-fg">{[user.email, user.phone].filter(Boolean).length} of 2</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-fg-subtle">Passkeys</dt><dd className="font-medium text-fg">{user.passkeys}</dd></div>
          </dl>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <form onSubmit={save} noValidate>
            <CardHeader title="Personal information" description="Used to personalise your account. Your date of birth is never shown publicly." icon="user" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              {field("firstName", "First name", { autoComplete: "given-name", maxLength: 50 })}
              {field("surname", "Surname", { autoComplete: "family-name", maxLength: 50 })}
              <div className="sm:col-span-2 sm:max-w-xs">
                {field("dob", "Date of birth", { type: "date", min: "1900-01-01", max: maxDob, autoComplete: "bday" })}
                {!errors.dob && age !== null && <p className="mt-1.5 text-xs text-fg-subtle">{age} years old · must be {MIN_AGE}+</p>}
              </div>
            </CardBody>
            <CardFooter>
              <p className={cn("text-xs transition-opacity", dirty ? "text-warning-text opacity-100" : "opacity-0")} aria-live="polite">{dirty ? "You have unsaved changes" : ""}</p>
              <div className="flex gap-2">
                <Button onClick={() => { setForm(initial); setErrors({}); }} disabled={!dirty || busy}>Cancel</Button>
                <Button type="submit" variant="primary" loading={busy} disabled={!dirty}>Save changes</Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader title="Contact methods" description="Where we send one-time codes. Each one is verified before it's added." icon="mail" />
          <CardBody>
            <ul className="divide-y divide-line rounded-xl border border-line">
              <ContactRow icon="mail" label="Email" value={user.email} onAdd={() => setContact("email")} />
              <ContactRow icon="phone" label="Phone" value={user.phone} onAdd={() => setContact("phone")} />
            </ul>
          </CardBody>
        </Card>
      </div>

      <AddContactDialog open={contact !== null} channel={contact ?? "email"} onClose={() => setContact(null)} />
    </div>
  );
}

function ContactRow({ icon, label, value, onAdd }: { icon: IconName; label: string; value: string | null; onAdd: () => void }) {
  return (
    <li className="flex items-center gap-3 bg-surface px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted"><Icon name={icon} className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-fg-subtle">{label}</p>
        <p className={cn("truncate text-sm font-medium", value ? "text-fg" : "text-fg-subtle")}>{value ?? "Not added"}</p>
      </div>
      {value ? (
        <div className="flex items-center gap-2">
          <Badge tone="success" dot>Verified</Badge>
          <Tooltip label="Changing a verified contact is coming soon" side="top">
            <Button size="sm" variant="ghost" disabled aria-label={`Change ${label} (coming soon)`}>Change</Button>
          </Tooltip>
        </div>
      ) : (
        <Button size="sm" variant="primary" icon="plus" onClick={onAdd}>Add</Button>
      )}
    </li>
  );
}
