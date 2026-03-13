import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl">Create account</h1>
          <p className="text-muted-foreground text-sm">
            Sign up to start creating presentations
          </p>
        </div>

        <SignUpForm />

        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link className="text-foreground underline" href="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
