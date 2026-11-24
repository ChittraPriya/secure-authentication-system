export type DeviceKind = "mobile" | "tablet" | "desktop";
export type ParsedDevice = { browser: string; os: string; kind: DeviceKind; label: string };

/** Tiny dependency-free user-agent parser — good enough for "Chrome on Windows" style labels. */
export function parseUserAgent(ua: string | null | undefined): ParsedDevice {
  if (!ua) return { browser: "Unknown browser", os: "Unknown OS", kind: "desktop", label: "Unknown device" };
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\/|Opera/.test(ua) ? "Opera" :
    /SamsungBrowser/.test(ua) ? "Samsung Internet" :
    /Firefox\/|FxiOS/.test(ua) ? "Firefox" :
    /Chrome\/|CriOS/.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" : "Browser";
  const os =
    /iPhone/.test(ua) ? "iPhone" :
    /iPad/.test(ua) ? "iPad" :
    /Android/.test(ua) ? "Android" :
    /Windows/.test(ua) ? "Windows" :
    /Mac OS X|Macintosh/.test(ua) ? "macOS" :
    /CrOS/.test(ua) ? "ChromeOS" :
    /Linux/.test(ua) ? "Linux" : "Unknown OS";
  const kind: DeviceKind = /iPad|Tablet/.test(ua) ? "tablet" : /iPhone|Mobile|Android/.test(ua) ? "mobile" : "desktop";
  return { browser, os, kind, label: `${browser} on ${os}` };
}

export function describeDevice(ua: string | null | undefined) {
  return parseUserAgent(ua).label;
}

/** Best-effort split of a stored "Chrome on Windows" label. */
export function splitLabel(label: string) {
  const [browser, os] = label.split(" on ");
  return { browser: browser ?? label, os: os ?? "" };
}

/** Hide loopback/local addresses — they say nothing useful about where a sign-in came from. */
export function isMeaningfulIp(ip: string | null | undefined): ip is string {
  return Boolean(ip) && !/^(local|::1$|127\.|::ffff:127\.)/.test(ip as string);
}
