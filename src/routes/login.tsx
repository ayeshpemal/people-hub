import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message);
    else if (mode === "signup" && !result.data.session)
      setMessage("Check your email to confirm your account.");
    else void navigate({ to: "/" });
    setSubmitting(false);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-silver px-4 text-ink">
      <section className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-sm ring-1 ring-ink/10">
        <div className="mb-6">
          <p className="font-display text-2xl font-semibold">Person Cache</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to your private directory"
              : "Create your private directory"}
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-lg bg-silver px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10"
          />
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rounded-lg bg-silver px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-brand">{message}</p>}
          <button
            disabled={submitting}
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ink-foreground disabled:opacity-60"
          >
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-ink"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
