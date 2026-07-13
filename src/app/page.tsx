"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CoupleHearts } from "@/components/illustrations/CoupleHearts";
import { GlassCard } from "@/components/ui/GlassCard";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useAuth } from "@/providers/AuthProvider";

const FEATURES = [
  { emoji: "📖", title: "Timeline", text: "Your whole story — first meet to yesterday's laugh." },
  { emoji: "💬", title: "Chat", text: "A private lane for the two of you — reactions, pins & read receipts." },
  { emoji: "🎮", title: "16 Games", text: "Quizzes, dares, puzzles and a dash game to beat." },
  { emoji: "🤖", title: "Cupid AI", text: "Your relationship's own assistant — ideas, plans and gentle nudges." },
  { emoji: "📅", title: "Calendar", text: "Dates, trips and anniversaries — never miss one." },
  { emoji: "💌", title: "Letters", text: "Slow, scheduled love letters. Sealed until it's time." },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { canInstall, install } = useInstallPrompt();

  // Signed-in visitors go straight to the dashboard.
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-safe">
      {/* Nav */}
      <nav className="flex items-center justify-between py-5">
        <span className="text-2xl font-bold gradient-text" style={{ fontFamily: "var(--font-display)" }}>
          Duet
        </span>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-2xl px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-blush-600">
            Sign in
          </Link>
          <Link href="/signup" className="gradient-btn rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blush-500/25">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 text-center md:text-left">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-lilac-500">
            A cozy app for two
          </motion.p>
          <motion.h1 variants={fadeUp} className="text-4xl font-bold leading-tight sm:text-5xl">
            Your relationship,<br />
            <span className="gradient-text">beautifully together.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto max-w-md text-ink-soft md:mx-0">
            Memories, chat, games, plans and little rituals — one private, installable
            home for your love story. Works offline, syncs everywhere.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link href="/signup" className="gradient-btn rounded-2xl px-6 py-3 font-semibold text-white shadow-lg shadow-blush-500/25">
              Start your story 💞
            </Link>
            {canInstall && (
              <button
                onClick={install}
                className="glass rounded-2xl px-6 py-3 font-semibold text-blush-600 dark:text-blush-300"
              >
                Install app ⬇️
              </button>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 16, delay: 0.15 }}
        >
          <GlassCard padded={false} className="p-6">
            <CoupleHearts className="w-full text-ink" />
          </GlassCard>
        </motion.div>
      </section>

      {/* Features */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.title} variants={fadeUp}>
            <GlassCard hover className="h-full">
              <span aria-hidden className="text-3xl">{f.emoji}</span>
              <h3 className="mt-3 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{f.text}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.section>

      <footer className="py-10 text-center text-xs text-ink-soft">
        Made with 💖 · Duet keeps your data private to the two of you.
      </footer>
    </main>
  );
}
