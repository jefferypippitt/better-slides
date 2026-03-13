"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

interface ErrorState {
  actionHref?: string;
  actionLabel?: string;
  message: string;
}

interface FieldErrors {
  confirmPassword?: string;
  email?: string;
  name?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

function getServerErrorState(message?: string): ErrorState {
  const msg = message?.toLowerCase() ?? "";

  if (msg.includes("already exists") || msg.includes("user exists")) {
    return {
      actionHref: "/sign-in",
      actionLabel: "Sign in",
      message: "An account with this email already exists.",
    };
  }

  return { message: message ?? "Sign up failed. Please try again." };
}

function validateFields(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): FieldErrors {
  const errors: FieldErrors = {};

  if (!name.trim()) {
    errors.name = "Name is required.";
  } else if (name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (name.trim().length > NAME_MAX_LENGTH) {
    errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }

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

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function SignUpForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(false);

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors = validateFields(name, email, password, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const result = await signUp.email({ name: name.trim(), email, password });

    if (result.error) {
      setServerError(getServerErrorState(result.error.message));
      setLoading(false);
      return;
    }

    router.push("/write");
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          aria-invalid={!!fieldErrors.name}
          autoComplete="name"
          id="name"
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) {
              clearFieldError("name");
            }
          }}
          type="text"
          value={name}
        />
        {fieldErrors.name && (
          <p className="text-destructive text-xs" id="name-error">
            {fieldErrors.name}
          </p>
        )}
      </div>

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
              clearFieldError("email");
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
          autoComplete="new-password"
          id="password"
          maxLength={PASSWORD_MAX_LENGTH}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              clearFieldError("password");
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

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          aria-describedby={
            fieldErrors.confirmPassword ? "confirm-password-error" : undefined
          }
          aria-invalid={!!fieldErrors.confirmPassword}
          autoComplete="new-password"
          id="confirm-password"
          maxLength={PASSWORD_MAX_LENGTH}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              clearFieldError("confirmPassword");
            }
          }}
          type="password"
          value={confirmPassword}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-destructive text-xs" id="confirm-password-error">
            {fieldErrors.confirmPassword}
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
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
