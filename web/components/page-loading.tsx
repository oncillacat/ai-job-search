export function PageLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-28 rounded-md bg-surface-2" />
      <div className="h-10 w-3/4 rounded-md bg-surface-2" />
      <div className="h-40 rounded-3xl bg-surface-2" />
      <div className="h-24 rounded-3xl bg-surface-2" />
    </div>
  );
}
