const bar = "animate-pulse rounded-md bg-line/70";

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className={`${bar} mb-6 h-8 w-48`} />
      <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="panel">
            <div className={`${bar} h-3 w-20`} />
            <div className={`${bar} my-2 h-7 w-32`} />
            <div className={`${bar} h-8 w-full`} />
          </div>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-1 gap-3 min-[1000px]:grid-cols-[2fr_1fr]">
        <div className="panel">
          <div className={`${bar} h-[280px] w-full`} />
        </div>
        <div className="panel">
          <div className={`${bar} h-[280px] w-full`} />
        </div>
      </div>
      <div className="panel">
        <div className={`${bar} h-[240px] w-full`} />
      </div>
    </div>
  );
}
