import { cn } from "@/lib/cn";

/** CSS-only tooltip (hover + keyboard focus). Server-component safe. */
export function Tooltip({ label, side = "bottom", children, className }: { label: string; side?: "bottom" | "top" | "right"; children: React.ReactNode; className?: string }) {
  const pos = {
    bottom: "top-full left-1/2 mt-2 -translate-x-1/2 -translate-y-1 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0",
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0",
    right: "left-full top-1/2 ml-2 -translate-y-1/2 -translate-x-1 group-hover/tt:translate-x-0 group-focus-within/tt:translate-x-0",
  }[side];
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs font-medium text-bg opacity-0 shadow-pop",
          "transition duration-150 ease-out delay-0 group-hover/tt:opacity-100 group-hover/tt:delay-300 group-focus-within/tt:opacity-100",
          pos,
        )}
      >
        {label}
      </span>
    </span>
  );
}
