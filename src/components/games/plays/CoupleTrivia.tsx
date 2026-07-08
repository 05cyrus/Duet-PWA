"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { Button } from "@/components/ui/Button";
import { useGameScore } from "@/hooks/useGameScore";
import { COUPLE_TRIVIA } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";

const ROUNDS = 8;

/** Pass-and-play: one partner answers out loud, the other guesses first. */
export function CoupleTrivia() {
  const game = gameById("couple-trivia")!;
  const { submitScore, unlockAchievement } = useGameScore(game);
  const { myName, partnerName } = useCouple();

  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [matches, setMatches] = useState(0);
  const [done, setDone] = useState(false);

  const deck = useMemo(
    () => [...COUPLE_TRIVIA].sort(() => 0.5 - Math.random()).slice(0, ROUNDS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  const answerer = i % 2 === 0 ? partnerName : myName;
  const guesser = i % 2 === 0 ? myName : partnerName;

  const record = (matched: boolean) => {
    const total = matched ? matches + 1 : matches;
    if (matched) setMatches(total);
    if (i + 1 >= deck.length) {
      setDone(true);
      submitScore(total * 10, { matches: total, rounds: deck.length });
      if (total === deck.length) unlockAchievement("mindreaders", "Mind Readers", "🔮", 25);
    } else {
      setI(i + 1);
    }
  };

  const reset = () => { setSeed((s) => s + 1); setI(0); setMatches(0); setDone(false); };

  if (done) {
    return (
      <GameOver score={`${matches}/${deck.length}`} label="Matched answers" onReplay={reset}>
        <p className="text-sm text-ink-soft">
          {matches >= deck.length - 1 ? "You two share one brain 🧠💕" : "Great excuse for a deep-talk date!"}
        </p>
      </GameOver>
    );
  }

  return (
    <div className="text-center">
      <p className="mb-1 text-xs font-bold text-ink-soft">Round {i + 1}/{deck.length} · {matches} matched</p>
      <p className="mb-4 rounded-2xl bg-lilac-100/70 px-3 py-2 text-xs font-semibold text-lilac-600 dark:bg-lilac-500/15 dark:text-lilac-300">
        🎯 {guesser} guesses first, then {answerer} reveals the truth!
      </p>
      <AnimatePresence mode="wait">
        <motion.h2
          key={i}
          initial={{ opacity: 0, rotateX: 60 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={{ opacity: 0, rotateX: -60 }}
          className="mx-auto mb-6 max-w-sm text-xl font-bold leading-snug"
        >
          {deck[i]}
        </motion.h2>
      </AnimatePresence>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => record(false)}>Missed it 😅</Button>
        <Button onClick={() => record(true)}>We matched! 💞</Button>
      </div>
    </div>
  );
}
