import { cn } from "@/lib/cn";

/** OneKey mark: a keyhole inside a rounded shield tile. Pure SVG, scales crisply. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-gradient-to-br from-[#6d5cff] to-[#4532d6] shadow-[0_2px_8px_-2px_rgb(91_76_240/0.6),inset_0_1px_0_rgb(255_255_255/0.25)]", className)}>
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%] text-white" fill="none" aria-hidden>
        <path d="M12 2.8 5 5.6v5.6c0 4.4 3 8.3 7 9.4 4-1.1 7-5 7-9.4V5.6l-7-2.8Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <circle cx="12" cy="10.4" r="2" fill="currentColor" />
        <path d="M12 12.2v3.6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function BrandName({ caption = true }: { caption?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span className="text-[15px] font-semibold tracking-tight text-fg">OneKey</span>
      {caption && <span className="mt-1 text-[11px] font-medium text-fg-subtle">Secure Auth</span>}
    </span>
  );
}
