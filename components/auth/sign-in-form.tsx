"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

interface AuthError {
  code?: string;
  message?: string;
  status?: number;
}

interface ErrorState {
  actionHref?: string;
  actionLabel?: string;
  message: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

function getServerErrorState(error?: AuthError | null): ErrorState {
  const msg = error?.message?.toLowerCase() ?? "";
  const code = error?.code?.toLowerCase() ?? "";

  if (msg.includes("user not found") || code.includes("user_not_found")) {
    return {
      actionHref: "/sign-up",
      actionLabel: "Create an account",
      message: "No account found for this email.",
    };
  }

  if (msg.includes("invalid") || msg.includes("password")) {
    return { message: "Incorrect email or password." };
  }

  if (error?.status === 401) {
    return {
      actionHref: "/sign-up",
      actionLabel: "Create an account",
      message: "No account found for this email, or the password is incorrect.",
    };
  }

  return { message: error?.message ?? "Sign in failed. Please try again." };
}

function validateFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`;
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/write";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors = validateFields(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        setServerError(getServerErrorState(result.error as AuthError));
        setLoading(false);
        return;
      }
    } catch (err: unknown) {
      setServerError(getServerErrorState(err as AuthError));
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          aria-invalid={!!fieldErrors.email}
          autoComplete="email"
          id="email"
          maxLength={EMAIL_MAX_LENGTH}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          type="email"
          value={email}
        />
        {fieldErrors.email && (
          <p className="text-destructive text-xs" id="email-error">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          aria-invalid={!!fieldErrors.password}
          autoComplete="current-password"
          id="password"
          maxLength={PASSWORD_MAX_LENGTH}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          type="password"
          value={password}
        />
        {fieldErrors.password && (
          <p className="text-destructive text-xs" id="password-error">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-destructive text-sm" role="alert">
          {serverError.message}{" "}
          {serverError.actionHref && serverError.actionLabel ? (
            <Link className="underline" href={serverError.actionHref}>
              {serverError.actionLabel}
            </Link>
          ) : null}
        </p>
      )}

      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
