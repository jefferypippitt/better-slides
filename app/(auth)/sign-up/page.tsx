import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center border-border border-t bg-background px-4 py-8 sm:px-6">
      <div className="relative flex w-full max-w-5xl flex-col border border-border bg-card md:h-(--auth-card-height) md:overflow-hidden">
        <div className="flex h-8 items-center justify-center border-border border-b px-4 sm:px-5">
          <span className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
            CREATE ACCOUNT
          </span>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-2">
          <aside className="flex h-full flex-col border-border border-b p-5 md:border-r md:border-b-0 md:p-6">
            <div className="mx-auto my-auto w-full max-w-md text-left">
              <h1 className="font-bold text-[clamp(2rem,4.8vw,3.2rem)] leading-[0.95] tracking-tight">
                Sign up for an account
              </h1>
            </div>
            <div className="mt-auto border-border pt-4">
              <p className="max-w-md text-foreground text-sm leading-relaxed">
                By clicking continue, you agree to our{" "}
                <Link
                  className="text-foreground underline underline-offset-4"
                  href="/terms"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  className="text-foreground underline underline-offset-4"
                  href="/privacy"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </aside>

          <section className="h-full overflow-y-auto p-5 md:p-6">
            <div className="mx-auto w-full max-w-sm space-y-6">
              <div className="space-y-1">
                <h2 className="font-semibold text-2xl">
                  Enter your credentials
                </h2>
              </div>

              <SignUpForm />

              <p className="text-center text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link
                  className="text-foreground underline underline-offset-4"
                  href="/sign-in"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </section>
        </div>

        <div className="h-8 border-border border-t px-4 sm:px-5" />
      </div>
    </div>
  );
}
