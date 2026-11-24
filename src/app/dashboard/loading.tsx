import { Skeleton } from "@/components/ui/misc";

/** Shimmer skeleton shown while a dashboard page streams in. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-4 p-5">
            <div className="flex justify-between"><Skeleton className="h-7 w-28" /><Skeleton className="h-5 w-16 rounded-full" /></div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="card space-y-5 p-6">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div></div>
          ))}
        </div>
        <div className="card space-y-4 p-6"><Skeleton className="h-14 w-14 rounded-2xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-24 w-full" /></div>
      </div>
    </div>
  );
}
