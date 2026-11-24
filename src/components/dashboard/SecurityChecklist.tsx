"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ChecklistItem } from "@/lib/security";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AddContactDialog } from "./AddContactDialog";
import { RegisterPasskeyButton } from "./actions";

/** Security steps with live status and a contextual action to finish each missing one. */
export function SecurityChecklist({ items }: { items: ChecklistItem[] }) {
  const [contact, setContact] = useState<"email" | "phone" | null>(null);

  return (
    <>
      <ul className="stagger grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "spotlight group flex flex-col rounded-xl border p-4 transition-colors duration-300",
              item.done ? "border-line bg-surface" : "border-warning/30 bg-warning-soft/40",
            )}
          >
            <div className="flex items-start gap-3">
              <span className={cn("relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border", item.done ? "border-line bg-surface-2 text-fg-muted" : "border-warning/30 bg-surface text-warning-text")}>
                <Icon name={item.icon} className="h-4 w-4" />
                <span className={cn("absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-surface animate-pop", item.done ? "bg-success text-white" : "bg-warning text-white")}>
                  <Icon name={item.done ? "check" : "alertCircle"} className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <p className="text-sm font-medium text-fg">{item.title}</p>
                  <Badge tone={item.done ? "success" : "warning"}>{item.statusLabel}</Badge>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-fg-muted">{item.description}</p>
              </div>
            </div>
            {item.action && (
              <div className="mt-3 flex justify-end">
                {item.action.kind === "link" && (
                  <Link href={item.action.href} className={buttonClass("ghost", "sm", "group/a")}>
                    {item.action.label}
                    <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform group-hover/a:translate-x-0.5" />
                  </Link>
                )}
                {item.action.kind === "add-passkey" && <RegisterPasskeyButton size="sm" variant="primary" label={item.action.label} />}
                {item.action.kind === "add-contact" && (() => {
                  const channel = item.action.channel;
                  return <Button size="sm" variant="primary" icon="plus" onClick={() => setContact(channel)}>{item.action.label}</Button>;
                })()}
              </div>
            )}
          </li>
        ))}
      </ul>
      <AddContactDialog open={contact !== null} channel={contact ?? "email"} onClose={() => setContact(null)} />
    </>
  );
}
