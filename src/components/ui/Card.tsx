import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

/** Base surface. `interactive` adds the cursor spotlight + hover lift. */
export function Card({ className, interactive, children, as: Tag = "section" }: { className?: string; interactive?: boolean; children: React.ReactNode; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("card", interactive && "spotlight lift", className)}>{children}</Tag>;
}

export function CardHeader({ title, description, icon, action, className }: { title: React.ReactNode; description?: React.ReactNode; icon?: IconName; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 pb-5 pt-4 sm:px-6", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-6", className)}>{children}</div>;
}
