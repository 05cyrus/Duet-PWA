"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import type { LoveStats as Stats } from "@/hooks/useLoveStats";
import { Skeleton } from "@/components/ui/Skeleton";

/** Stat-tile row of lifetime couple statistics. */
export function LoveStats({ stats }: { stats: Stats }) {
  const tiles = [
    { label: "Messages", value: stats.messages, emoji: "💬" },
    { label: "Memories", value: stats.memories, emoji: "📖" },
    { label: "Photos", value: stats.photos, emoji: "📸" },
    { label: "Letters", value: stats.letters, emoji: "💌" },
    { label: "Games played", value: stats.gamesPlayed, emoji: "🎮" },
    { label: "Wishes done", value: stats.wishesDone, emoji: "🪣" },
  ];

  return (
    <GlassCard>
      <h2 className="mb-3 text-sm font-bold">Love statistics</h2>
      {stats.loading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {tiles.map((t) => <Skeleton key={t.label} className="h-16" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white/40 px-2 py-3 text-center dark:bg-white/5"
            >
              <p aria-hidden className="text-lg">{t.emoji}</p>
              <p className="text-xl font-bold tabular-nums">{t.value.toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-ink-soft">{t.label}</p>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
