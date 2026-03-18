import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="legal-section relative min-h-svh">
      <div className="absolute top-6 left-6">
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft
              className="transition-transform group-hover/button:-translate-x-0.5"
              size={12}
              weight="bold"
            />
            BACK
          </Link>
        </Button>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
        <main>{children}</main>
      </div>
    </div>
  );
}
