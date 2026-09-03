type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-surface-container ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="flex min-w-52.5 flex-1 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
      <div className="mb-4 flex items-start justify-between gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 p-6 ${className}`}>
      {Array.from({ length: rows }, (_, index) => index).map((row) => (
        <Skeleton key={row} className="h-12" />
      ))}
    </div>
  );
}

export function SkeletonStoreCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow">
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="mb-3 h-5 w-3/4" />
        <div className="mt-auto space-y-2 border-t border-outline-variant pt-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="border-t border-outline-variant bg-surface-container-low px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
