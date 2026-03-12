"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/write";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn.email({
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message ?? "Sign in failed");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            Enter your credentials to continue
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              autoComplete="current-password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

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
