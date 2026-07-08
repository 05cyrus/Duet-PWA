"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authErrorMessage } from "@/lib/authErrors";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

export default function SignupPage() {
  const { user, loading, signInGoogle, signUpEmail } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/pair");
  }, [loading, user, router]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(authErrorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Start your story ✨</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Create an account, then invite your favorite person.
        </p>
      </div>

      <GoogleButton loading={busy} onClick={() => run(async () => { await signInGoogle(); })} />

      <div className="flex items-center gap-3 text-xs text-ink-soft" aria-hidden>
        <span className="h-px flex-1 bg-current opacity-20" /> or <span className="h-px flex-1 bg-current opacity-20" />
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => { await signUpEmail(name.trim() || "Sweetheart", email, password); });
        }}
      >
        <Input label="Your name" required value={name} autoComplete="name"
          onChange={(e) => setName(e.target.value)} placeholder="Alex" />
        <Input label="Email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input label="Password" type="password" required autoComplete="new-password" minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters" />
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        Already have one?{" "}
        <Link href="/login" className="font-semibold text-blush-500 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
