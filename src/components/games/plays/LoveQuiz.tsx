"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { useGameScore } from "@/hooks/useGameScore";
import { LOVE_QUIZ } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

const QUESTIONS = 8;

export function LoveQuiz() {
  const game = gameById("love-quiz")!;
  const { submitScore, unlockAchievement } = useGameScore(game);
  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const deck = useMemo(
    () => [...LOVE_QUIZ].sort(() => 0.5 - Math.random()).slice(0, QUESTIONS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  const q = deck[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const correct = idx === q.answer;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (i + 1 >= deck.length) {
        const final = score + (correct ? 1 : 0);
        setDone(true);
        submitScore(final * 10, { correct: final, total: deck.length });
        if (final === deck.length) unlockAchievement("perfect", "Perfect Love Quiz", "💯", 25);
      } else {
        setI(i + 1);
        setPicked(null);
      }
    }, 900);
  };

  const reset = () => { setSeed((s) => s + 1); setI(0); setPicked(null); setScore(0); setDone(false); };

  if (done) {
    return (
      <GameOver score={`${score}/${deck.length}`} label="Correct answers" onReplay={reset}>
        <p className="text-sm text-ink-soft">
          {score === deck.length ? "Cupid himself would be proud 💘" :
           score >= deck.length / 2 ? "Not bad, lovebird!" : "More date nights needed 😄"}
        </p>
      </GameOver>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs font-bold text-ink-soft">
        <span>Question {i + 1}/{deck.length}</span>
        <span>Score {score}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <h2 className="mb-4 text-lg font-bold">{q.q}</h2>
          <div className="grid gap-2">
            {q.options.map((opt, idx) => {
              const state = picked === null ? "idle" : idx === q.answer ? "correct" : idx === picked ? "wrong" : "dim";
              return (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => pick(idx)}
                  disabled={picked !== null}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                    state === "idle" && "border-blush-200/60 bg-white/50 hover:border-blush-400 dark:border-white/10 dark:bg-white/5",
                    state === "correct" && "border-emerald-400 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
                    state === "wrong" && "border-rose-400 bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
                    state === "dim" && "border-transparent opacity-40",
                  )}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
