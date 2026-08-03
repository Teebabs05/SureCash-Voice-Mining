// Generic route-level loading skeleton, shown instantly by Next.js while a
// page segment (and its layout's server-side auth check) resolve, so
// navigation never looks like it's hanging on a blank screen.
export function RouteSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-6 w-1/2 rounded-lg bg-surface-muted" />
      <div className="h-28 w-full rounded-2xl bg-surface-muted" />
      <div className="flex flex-col gap-2.5">
        <div className="h-14 w-full rounded-xl bg-surface-muted" />
        <div className="h-14 w-full rounded-xl bg-surface-muted" />
        <div className="h-14 w-full rounded-xl bg-surface-muted" />
      </div>
    </div>
  );
}
