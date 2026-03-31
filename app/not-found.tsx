import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="font-semibold text-2xl">Page not found</h1>
      <p className="max-w-md text-muted-foreground text-sm">
        The page you requested does not exist or is no longer available.
      </p>
      <Link
        className="font-medium text-foreground text-sm underline underline-offset-4"
        href="/"
      >
        Return home
      </Link>
    </main>
  );
}
