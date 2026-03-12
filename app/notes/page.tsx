import Link from "next/link";

export default function NotesIndexPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-4 px-6 py-10">
      <h1 className="font-semibold text-2xl tracking-tight">
        Open notes by deck
      </h1>
      <p className="text-muted-foreground">
        Speaker notes are now deck-specific. Open the route that matches your
        presentation:
      </p>
      <code className="rounded-md bg-muted px-3 py-2 text-sm">
        /notes/&lt;deckId&gt;
      </code>
      <p className="text-muted-foreground text-sm">
        Example while presenting deck <code>abc123</code>:
      </p>
      <Link
        className="text-sm underline underline-offset-4"
        href="/notes/abc123"
      >
        /notes/abc123
      </Link>
    </main>
  );
}
