"use client";

import type { ConfirmationResult } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authErrorMessage } from "@/lib/authErrors";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

type Tab = "email" | "otp";

export default function LoginPage() {
  const { user, loading, signInGoogle, signInEmail, resetPassword, sendOtp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("email");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
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
        <h1 className="text-2xl font-bold">Welcome back 💞</h1>
        <p className="mt-1 text-sm text-ink-soft">Your shared universe is waiting.</p>
      </div>

      <GoogleButton loading={busy} onClick={() => run(async () => { await signInGoogle(); })} />

      <div className="flex items-center gap-3 text-xs text-ink-soft" aria-hidden>
        <span className="h-px flex-1 bg-current opacity-20" /> or <span className="h-px flex-1 bg-current opacity-20" />
      </div>

      {/* Method tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-blush-100/60 p-1 dark:bg-white/5" role="tablist">
        {(["email", "otp"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t ? "bg-white text-blush-600 shadow dark:bg-white/15 dark:text-blush-300" : "text-ink-soft"
            }`}
          >
            {t === "email" ? "Email" : "Phone OTP"}
          </button>
        ))}
      </div>

      {tab === "email" ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => { await signInEmail(email, password); });
          }}
        >
          <Input label="Email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input label="Password" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <Button type="submit" loading={busy} className="w-full">Sign in</Button>
          <button
            type="button"
            className="mx-auto block text-xs font-semibold text-lilac-500 hover:underline"
            onClick={() => {
              if (!email) return toast("Type your email above first.", "info");
              run(async () => {
                await resetPassword(email);
                toast("Password reset email sent 💌", "success");
              });
            }}
          >
            Forgot password?
          </button>
        </form>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!confirmation) {
              run(async () => {
                const conf = await sendOtp(phone, "otp-recaptcha");
                setConfirmation(conf);
                toast("Code sent — check your phone 📲", "success");
              });
            } else {
              run(async () => { await confirmation.confirm(code); });
            }
          }}
        >
          {!confirmation ? (
            <Input label="Phone number" type="tel" required autoComplete="tel"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 1111" hint="Include the country code." />
          ) : (
            <Input label="6-digit code" inputMode="numeric" required
              value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
          )}
          <div id="otp-recaptcha" />
          <Button type="submit" loading={busy} className="w-full">
            {confirmation ? "Verify & sign in" : "Send code"}
          </Button>
          {confirmation && (
            <button type="button" onClick={() => setConfirmation(null)}
              className="mx-auto block text-xs font-semibold text-lilac-500 hover:underline">
              Use a different number
            </button>
          )}
        </form>
      )}

      <p className="text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-blush-500 hover:underline">
          Create your space
        </Link>
      </p>
    </div>
  );
}
