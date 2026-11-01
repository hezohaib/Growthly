import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-semibold tracking-tight">404</p>
      <p className="mt-2 text-muted">This page does not exist.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to overview
      </Link>
    </div>
  );
}
