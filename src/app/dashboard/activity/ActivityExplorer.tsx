"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { activityFilters, type ActivityCategory, type ActivityItem } from "@/lib/activity";
import { isMeaningfulIp } from "@/lib/device";
import { dayLabel, fmtDateTime, fmtTime } from "@/lib/format";
import { Badge, toneIconBox } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";

type Filter = "all" | ActivityCategory;

export function ActivityExplorer({ items }: { items: ActivityItem[] }) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const i of items) c[i.category] = (c[i.category] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((i) => (filter === "all" || i.category === filter) && (!s || `${i.title} ${i.detail ?? ""} ${i.device ?? ""} ${i.status}`.toLowerCase().includes(s)));
  }, [items, filter, q]);

  const groups = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const i of filtered) {
      const k = dayLabel(new Date(i.at));
      map.set(k, [...(map.get(k) ?? []), i]);
    }
    return [...map.entries()];
  }, [filtered]);

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["Time", "Event", "Status", "Details", "Device", "IP"], ...filtered.map((i) => [fmtDateTime(new Date(i.at)), i.title, i.status, i.detail ?? "", i.device ?? "", i.ip ?? ""])];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `security-activity-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
    toast({ tone: "success", title: "Export ready", description: `${filtered.length} event${filtered.length === 1 ? "" : "s"} saved as CSV.` });
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <SegmentedFilter value={filter} onChange={setFilter} counts={counts} />
        <div className="flex gap-2">
          <div className="relative flex-1 xl:w-64 xl:flex-none">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter events…" className="input h-9 pl-9" aria-label="Filter events" />
          </div>
          <Button icon="download" onClick={exportCsv} disabled={!filtered.length}><span className="hidden sm:inline">Export CSV</span></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="search" title="No matching events" description={q ? `Nothing matches “${q}” in this view.` : "No events in this category yet."} />
      ) : (
        <div key={filter + q} className="divide-y divide-line">
          {groups.map(([day, list], gi) => (
            <section key={day} aria-label={day}>
              <h3 className="sticky top-14 z-10 border-b border-line bg-surface/90 px-4 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle backdrop-blur sm:px-6">{day}</h3>
              <ul>
                {list.map((i, ii) => (
                  <li
                    key={i.id}
                    className="group flex gap-3.5 px-4 py-3.5 transition-colors animate-rise hover:bg-surface-2/50 sm:px-6"
                    style={{ animationDelay: `${Math.min(gi * 3 + ii, 12) * 35}ms` }}
                  >
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-105", toneIconBox[i.tone])}>
                      <Icon name={i.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <p className="text-sm font-medium text-fg">{i.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge tone={i.tone}>{i.status}</Badge>
                          <time dateTime={i.at} title={fmtDateTime(new Date(i.at))} className="text-xs tabular-nums text-fg-subtle" suppressHydrationWarning>{fmtTime(new Date(i.at))}</time>
                        </div>
                      </div>
                      <p className="mt-0.5 flex flex-wrap gap-x-1.5 text-[13px] text-fg-muted">
                        {i.detail && <span className="truncate">{i.detail}</span>}
                        {i.detail && i.device && <span aria-hidden className="text-fg-subtle">·</span>}
                        {i.device && <span>{i.device}</span>}
                        {isMeaningfulIp(i.ip) && <><span aria-hidden className="text-fg-subtle">·</span><span className="font-mono text-xs">{i.ip}</span></>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <div className="border-t border-line px-4 py-3 text-xs text-fg-subtle sm:px-6">
        Showing {filtered.length} of {items.length} most recent events
      </div>
    </Card>
  );
}

/** Segmented control with a sliding highlight. */
function SegmentedFilter({ value, onChange, counts }: { value: Filter; onChange: (f: Filter) => void; counts: Record<string, number> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>(`[data-f="${value}"]`);
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value]);
  return (
    <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
      <div ref={wrap} role="tablist" aria-label="Filter activity" className="relative inline-flex rounded-lg border border-line bg-surface-2 p-1">
        {ind && <span aria-hidden className="absolute bottom-1 top-1 rounded-md bg-surface shadow-sm ring-1 ring-line transition-all duration-300 ease-out" style={{ left: ind.left, width: ind.width }} />}
        {activityFilters.map((f) => (
          <button
            key={f.id}
            data-f={f.id}
            role="tab"
            aria-selected={value === f.id}
            onClick={() => onChange(f.id)}
            className={cn("relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", value === f.id ? "text-fg" : "text-fg-muted hover:text-fg")}
          >
            {f.label}
            <span className={cn("rounded px-1 text-[11px] tabular-nums", value === f.id ? "bg-accent-soft text-accent-text" : "text-fg-subtle")}>{counts[f.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
