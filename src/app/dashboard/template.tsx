/** Re-mounts on every dashboard navigation, so each page fades/rises in (respects reduced motion via CSS). */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
