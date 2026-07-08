"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { daysTogether, relationshipLevel } from "@/lib/utils";
import { useCouple } from "@/providers/CoupleProvider";

/** Hero: days together, relationship level and love score in one banner. */
export function HeroCard({ loveScore }: { loveScore: number }) {
  const { couple, myName, partnerName } = useCouple();
  if (!couple) return null;

  const days = daysTogether(couple.anniversary);
  const { level, title, progress } = relationshipLevel(days, couple.xp);

  return (
    <GlassCard className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-gradient-to-br from-blush-300/40 to-lilac-300/40 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-ink-soft">
            {myName} <span className="heartbeat inline-block" aria-hidden>💞</span> {partnerName}
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <motion.span
              key={days}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="text-5xl font-bold gradient-text tabular-nums"
            >
              {days.toLocaleString()}
            </motion.span>
            <span className="text-sm font-semibold text-ink-soft">days together</span>
          </p>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">Lv {level}</p>
            <p className="text-xs font-semibold text-ink-soft">{title}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{loveScore}</p>
            <p className="text-xs font-semibold text-ink-soft">Love score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{couple.coins.toLocaleString()}</p>
            <p className="text-xs font-semibold text-ink-soft">Coins 🪙</p>
          </div>
        </div>
      </div>
      <div className="relative mt-4">
        <ProgressBar value={progress} label={`Progress to level ${level + 1}`} />
        <p className="mt-1 text-right text-[11px] font-semibold text-ink-soft">
          {Math.round(progress * 100)}% to Lv {level + 1}
        </p>
      </div>
    </GlassCard>
  );
}
