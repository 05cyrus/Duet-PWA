"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { useGameScore } from "@/hooks/useGameScore";
import { THIS_OR_THAT } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";
import { cn } from "@/lib/utils";

const ROUNDS = 10;

/** Pass-and-play: P1 picks secretly, P2 picks, match revealed. */
export function ThisOrThat() {
  const game = gameById("this-or-that")!;
  const { submitScore } = useGameScore(game);
  const { myName, partnerName } = useCouple();

  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [firstPick, setFirstPick] = useState<0 | 1 | null>(null);
  const [reveal, setReveal] = useState<null | boolean>(null);
  const [matches, setMatches] = useState(0);
  const [done, setDone] = useState(false);

  const deck = useMemo(
    () => [...THIS_OR_THAT].sort(() => 0.5 - Math.random()).slice(0, ROUNDS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  const pair = deck[i];
  const firstPlayer = i % 2 === 0 ? myName : partnerName;
  const secondPlayer = i % 2 === 0 ? partnerName : myName;

  const pick = (side: 0 | 1) => {
    if (reveal !== null) return;
    if (firstPick === null) {
      setFirstPick(side);
    } else {
      const matched = firstPick === side;
      setReveal(matched);
      if (matched) setMatches((m) => m + 1);
      setTimeout(() => {
        setReveal(null);
        setFirstPick(null);
        if (i + 1 >= deck.length) {
          const total = matched ? matches + 1 : matches;
          setDone(true);
          submitScore(total * 10, { matches: total, rounds: deck.length });
        } else {
          setI(i + 1);
        }
      }, 1300);
    }
  };

  const reset = () => { setSeed((s) => s + 1); setI(0); setFirstPick(null); setReveal(null); setMatches(0); setDone(false); };

  if (done) {
    return <GameOver score={`${matches}/${deck.length}`} label="Same picks" onReplay={reset} />;
  }

  return (
    <div className="text-center">
      <p className="mb-1 text-xs font-bold text-ink-soft">Round {i + 1}/{deck.length} · {matches} matched</p>
      <p className="mb-5 text-sm font-semibold">
        {reveal !== null
          ? reveal ? "Same choice! 💞" : "Opposites attract 😄"
          : firstPick === null
            ? <>📱 <b>{firstPlayer}</b>, pick secretly — don&apos;t peek, {secondPlayer}!</>
            : <>🔒 Locked in. Now <b>{secondPlayer}</b> picks!</>}
      </p>
      <AnimatePresence mode="wait">
        <motion.div key={i + (firstPick !== null ? "-2" : "")} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 gap-3">
          {pair.map((opt, idx) => (
            <motion.button
              key={opt}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => pick(idx as 0 | 1)}
              className={cn(
                "rounded-3xl border-2 px-4 py-10 text-base font-bold transition-colors",
                reveal !== null && firstPick === idx
                  ? "border-blush-400 bg-blush-100 dark:bg-blush-500/20"
                  : "border-blush-200/60 bg-white/50 hover:border-lilac-400 dark:border-white/10 dark:bg-white/5",
              )}
            >
              {opt}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
