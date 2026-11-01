"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-12">
      <div className="panel text-center" role="alert">
        <h2 className="text-[15px] font-semibold">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted">{error.message}</p>
        <button className="btn mt-4" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
