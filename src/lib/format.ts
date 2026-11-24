const LOCALE = "en-IN";

export function fmtDateTime(d: Date) {
  return d.toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "short" });
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString(LOCALE, { dateStyle: "medium" });
}

export function fmtTime(d: Date) {
  return d.toLocaleTimeString(LOCALE, { timeStyle: "short" });
}

export function fmtLongDate(d: Date) {
  return d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function timeAgo(d: Date, now = Date.now()) {
  const s = Math.round((now - d.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDate(d);
}

/** "Today", "Yesterday" or a date — used to group activity. */
export function dayLabel(d: Date, now = new Date()) {
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

export function initials(first: string, last: string) {
  return `${first.trim()[0] ?? ""}${last.trim()[0] ?? ""}`.toUpperCase();
}
