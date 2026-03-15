import Link from "next/link";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            Enter your credentials to continue
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-muted-foreground text-sm">
              Loading sign-in form...
            </div>
          }
        >
          <SignInForm />
        </Suspense>

        <p className="text-center text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link className="text-foreground underline" href="/sign-up">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
