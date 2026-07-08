"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useHeartBurst } from "@/components/ui/HeartBurst";
import { useGameScore } from "@/hooks/useGameScore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DAILY_CHALLENGES } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { dailyIndex, isoToday } from "@/lib/utils";

export function DailyChallenge() {
  const game = gameById("daily-challenge")!;
  const { submitScore, unlockAchievement } = useGameScore(game);
  const { burst, Hearts } = useHeartBurst();
  const today = isoToday();
  const challenge = DAILY_CHALLENGES[dailyIndex(DAILY_CHALLENGES.length, 7)];

  const [record, setRecord] = useLocalStorage<{ lastDone: string; streak: number }>(
    "duet-daily-challenge",
    { lastDone: "", streak: 0 },
  );
  const doneToday = record.lastDone === today;

  const complete = () => {
    if (doneToday) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = record.lastDone === yesterday.toISOString().slice(0, 10);
    const streak = wasYesterday ? record.streak + 1 : 1;
    setRecord({ lastDone: today, streak });
    submitScore(25 + Math.min(streak, 10) * 5, { streak, date: today });
    if (streak === 7) unlockAchievement("week-streak", "7-Day Devotion", "🌟", 40);
    burst(14);
  };

  return (
    <div className="text-center">
      <Hearts />
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-lilac-500">
        {new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto my-6 max-w-sm rounded-3xl bg-gradient-to-br from-blush-100/80 to-lilac-100/80 px-5 py-10 text-xl font-bold leading-snug dark:from-blush-500/15 dark:to-lilac-500/15"
      >
        {challenge}
      </motion.p>
      <p className="mb-4 text-sm font-semibold text-ink-soft">
        Current streak: <b>{record.streak}</b> 🔥
      </p>
      <Button size="lg" disabled={doneToday} onClick={complete}>
        {doneToday ? "Completed — see you tomorrow 💖" : "We did it! ✅"}
      </Button>
    </div>
  );
}
