"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { Button } from "@/components/ui/Button";
import { useGameScore } from "@/hooks/useGameScore";
import { NEVER_HAVE_I_EVER } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";

const LIVES = 5;

export function NeverHaveI() {
  const game = gameById("never-have-i")!;
  const { submitScore } = useGameScore(game);
  const { myName, partnerName } = useCouple();

  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [lives, setLives] = useState<[number, number]>([LIVES, LIVES]);
  const [done, setDone] = useState(false);

  const deck = useMemo(
    () => [...NEVER_HAVE_I_EVER].sort(() => 0.5 - Math.random()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );

  const names = [myName, partnerName];

  const confess = (who: 0 | 1 | "both" | "none") => {
    const next: [number, number] = [...lives];
    if (who === 0 || who === "both") next[0] = Math.max(0, next[0] - 1);
    if (who === 1 || who === "both") next[1] = Math.max(0, next[1] - 1);
    setLives(next);
    if (next[0] === 0 || next[1] === 0 || i + 1 >= deck.length) {
      setDone(true);
      submitScore((next[0] + next[1]) * 10, { rounds: i + 1 });
    } else {
      setI(i + 1);
    }
  };

  const reset = () => { setSeed((s) => s + 1); setI(0); setLives([LIVES, LIVES]); setDone(false); };

  if (done) {
    const winner = lives[0] === lives[1] ? "It's a tie of innocence 😇" :
      lives[0] > lives[1] ? `${myName} is the innocent one 😇` : `${partnerName} is the innocent one 😇`;
    return <GameOver score={winner} label="Result" onReplay={reset} />;
  }

  return (
    <div className="text-center">
      {/* Lives */}
      <div className="mb-5 flex justify-around">
        {names.map((n, idx) => (
          <div key={n + idx}>
            <p className="text-xs font-bold text-ink-soft">{n}</p>
            <p aria-label={`${lives[idx]} lives`} className="mt-1 text-sm tracking-wide">
              {"❤️".repeat(lives[idx])}{"🩶".repeat(LIVES - lives[idx])}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          className="mx-auto mb-6 max-w-sm rounded-3xl bg-white/60 px-5 py-8 text-lg font-bold leading-snug dark:bg-white/5"
        >
          {deck[i]}
        </motion.p>
      </AnimatePresence>

      <p className="mb-3 text-xs font-semibold text-ink-soft">Who has? (lose a heart if you have 🙈)</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="soft" onClick={() => confess(0)}>{myName} 🙋</Button>
        <Button variant="soft" onClick={() => confess(1)}>{partnerName} 🙋</Button>
        <Button variant="outline" onClick={() => confess("both")}>Both of us 😳</Button>
        <Button variant="outline" onClick={() => confess("none")}>Neither 😇</Button>
      </div>
    </div>
  );
}
