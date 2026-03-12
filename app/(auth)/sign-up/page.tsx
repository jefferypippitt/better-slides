"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signUp.email({
      name,
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message ?? "Sign up failed");
      setLoading(false);
      return;
    }

    router.push("/write");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl">Create account</h1>
          <p className="text-muted-foreground text-sm">
            Sign up to start creating presentations
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              autoComplete="name"
              id="name"
              onChange={(e) => setName(e.target.value)}
              required
              type="text"
              value={name}
            />
          </div>

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
              autoComplete="new-password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

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
