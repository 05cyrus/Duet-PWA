"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { useHeartBurst } from "@/components/ui/HeartBurst";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";
import { isoToday } from "@/lib/utils";

/**
 * Couple pairing flow:
 *  1. create a space (get invite code) OR join with a partner's code
 *  2. once both members joined → set the anniversary
 *  3. → dashboard
 */
export default function PairPage() {
  const { user, loading: authLoading } = useAuth();
  const { couple, isPaired, loading, createCouple, joinCouple, setAnniversary, partnerName } = useCouple();
  const { toast } = useToast();
  const router = useRouter();
  const { burst, Hearts } = useHeartBurst();

  const [mode, setMode] = useState<"pick" | "create" | "join">("pick");
  const [busy, setBusy] = useState(false);
  const [coupleName, setCoupleName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [anniversary, setAnniversaryInput] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!loading && couple && isPaired && couple.anniversary) router.replace("/dashboard");
  }, [loading, couple, isPaired, router]);

  const handleCreate = async () => {
    setBusy(true);
    try {
      await createCouple(coupleName.trim() || "Us");
      burst(12);
    } catch {
      toast("Couldn't create your space. Check your connection.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    try {
      const ok = await joinCouple(codeInput);
      if (!ok) toast("That code didn't match any space.", "error");
      else burst(14);
    } catch {
      toast("Couldn't join. Check your connection.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAnniversary = async () => {
    if (!anniversary) return toast("Pick your special date first 🌹", "info");
    setBusy(true);
    try {
      await setAnniversary(anniversary);
      burst(16);
      router.replace("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    if (!couple) return;
    const text = `Join me on Duet 💞 Our invite code is ${couple.inviteCode} — sign up at ${location.origin} and enter it on the pairing screen.`;
    if (navigator.share) {
      try { await navigator.share({ title: "Join me on Duet", text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast("Invite copied to clipboard 📋", "success");
    }
  };

  if (authLoading || loading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <span className="heartbeat text-5xl" aria-label="Loading">💞</span>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <Hearts />
      <h1 className="mb-6 text-3xl font-bold gradient-text" style={{ fontFamily: "var(--font-display)" }}>
        Duet
      </h1>

      <AnimatePresence mode="wait">
        {/* Step: waiting for partner / share code */}
        {couple && !isPaired && (
          <motion.div key="waiting" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <GlassCard className="w-full max-w-md space-y-4 text-center">
              <span className="text-5xl" aria-hidden>💌</span>
              <h2 className="text-xl font-bold">Invite your partner</h2>
              <p className="text-sm text-ink-soft">
                Share this code — when they enter it, your space connects.
              </p>
              <div
                className="mx-auto w-fit rounded-2xl bg-gradient-to-r from-blush-500 to-lilac-500 px-8 py-3 text-3xl font-bold tracking-[0.3em] text-white"
                aria-label={`Invite code ${couple.inviteCode}`}
              >
                {couple.inviteCode}
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={shareInvite}>Share invite 💞</Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(couple.inviteCode);
                    toast("Code copied 📋", "success");
                  }}
                >
                  Copy code
                </Button>
              </div>
              <p className="flex items-center justify-center gap-2 text-xs text-ink-soft">
                <span className="inline-block size-2 animate-pulse rounded-full bg-emerald-400" />
                Waiting for {"your partner"} to join — this updates live.
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Step: anniversary */}
        {couple && isPaired && !couple.anniversary && (
          <motion.div key="anniversary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <GlassCard className="w-full max-w-md space-y-4 text-center">
              <span className="text-5xl" aria-hidden>🎉</span>
              <h2 className="text-xl font-bold">You&apos;re connected with {partnerName}!</h2>
              <p className="text-sm text-ink-soft">One last thing — when did your story begin?</p>
              <Input
                label="Anniversary (relationship start)"
                type="date"
                max={isoToday()}
                value={anniversary}
                onChange={(e) => setAnniversaryInput(e.target.value)}
              />
              <Button onClick={handleAnniversary} loading={busy} className="w-full">
                Begin our journey 🚀
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {/* Step: pick create/join */}
        {!couple && mode === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
            <GlassCard hover className="cursor-pointer text-center" onClick={() => setMode("create")}>
              <span className="text-4xl" aria-hidden>🏡</span>
              <h2 className="mt-3 font-bold">Create our space</h2>
              <p className="mt-1 text-sm text-ink-soft">Start fresh and invite your partner with a code.</p>
            </GlassCard>
            <GlassCard hover className="cursor-pointer text-center" onClick={() => setMode("join")}>
              <span className="text-4xl" aria-hidden>🔑</span>
              <h2 className="mt-3 font-bold">I have a code</h2>
              <p className="mt-1 text-sm text-ink-soft">Your partner already made a space? Join them.</p>
            </GlassCard>
          </motion.div>
        )}

        {!couple && mode === "create" && (
          <motion.div key="create" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <GlassCard className="w-full max-w-md space-y-4">
              <h2 className="text-xl font-bold">Name your space 🏡</h2>
              <Input
                label="Couple name"
                placeholder="e.g. Alex & Sam"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setMode("pick")}>Back</Button>
                <Button onClick={handleCreate} loading={busy} className="flex-1">
                  Create & get invite code
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {!couple && mode === "join" && (
          <motion.div key="join" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <GlassCard className="w-full max-w-md space-y-4">
              <h2 className="text-xl font-bold">Enter the invite code 🔑</h2>
              <Input
                label="6-character code"
                placeholder="ABC123"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                className="[&_input]:text-center [&_input]:text-xl [&_input]:font-bold [&_input]:tracking-[0.3em]"
              />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setMode("pick")}>Back</Button>
                <Button onClick={handleJoin} loading={busy} disabled={codeInput.length !== 6} className="flex-1">
                  Connect 💞
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
