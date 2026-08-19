"use client";

import { useState } from "react";
import Link from "next/link";
import { Cpu, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const QUALIFIERS = [
  "Confidence-gated extraction",
  "Layered human review",
  "FHIR R4-native output",
  "Immutable audit trail",
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Context panel — establishes this is the same product as the landing
          page, not a bare auth template. Collapses to a compact header on
          mobile instead of eating the viewport above the form. */}
      <div className="flex flex-col justify-between border-b border-border bg-muted/40 px-6 py-8 sm:px-10 sm:py-10 lg:border-r lg:border-b-0 lg:px-14 lg:py-14">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_color-mix(in_oklch,var(--primary),transparent_65%)]">
            <Cpu className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-foreground">MedKnowledge AI</span>
        </Link>

        <div className="mt-10 max-w-md lg:mt-0">
          <p className="text-sm text-muted-foreground">Clinical Knowledge Intelligence Platform</p>
          <h1 className="mt-3 hidden text-2xl leading-snug font-semibold tracking-[-0.02em] text-foreground text-balance lg:block">
            Transforming medical literature into trusted, FHIR-native clinical decision knowledge.
          </h1>
        </div>

        <p className="mt-8 hidden flex-wrap gap-x-2.5 gap-y-1.5 text-xs text-muted-foreground lg:flex">
          {QUALIFIERS.map((item, index) => (
            <span key={item} className="flex items-center gap-2.5">
              {item}
              {index < QUALIFIERS.length - 1 && (
                <span className="text-muted-foreground/40" aria-hidden="true">
                  &middot;
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use the credentials provided by your institution&rsquo;s administrator.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@medknowledge.ai"
                aria-invalid={error ? true : undefined}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-xs text-muted-foreground">
            No self-serve sign-up &mdash; accounts are provisioned by your institution&rsquo;s
            administrator.{" "}
            <a href="mailto:hello@medknowledge.ai" className="text-primary hover:underline">
              Contact us
            </a>{" "}
            for access.
          </p>
        </div>
      </div>
    </div>
  );
}
