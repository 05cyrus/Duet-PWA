"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { useGameScore } from "@/hooks/useGameScore";
import { gameById } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "🌹", "💌", "🍫", "💍", "🧸", "🌙", "⭐"];

export function MemoryMatch() {
  const game = gameById("memory-match")!;
  const { submitScore, unlockAchievement } = useGameScore(game);

  const [seed, setSeed] = useState(0);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const cards = useMemo(
    () => [...EMOJIS, ...EMOJIS].sort(() => 0.5 - Math.random()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const isMatch = cards[a] === cards[b];
    const t = setTimeout(() => {
      if (isMatch) {
        setMatched((m) => new Set([...m, a, b]));
      }
      setFlipped([]);
    }, isMatch ? 350 : 800);
    return () => clearTimeout(t);
  }, [flipped, cards]);

  useEffect(() => {
    if (matched.size === cards.length && cards.length > 0 && !done) {
      setDone(true);
      const score = Math.max(10, 200 - moves * 5);
      submitScore(score, { moves });
      if (moves <= 12) unlockAchievement("sharp-memory", "Elephant Memory", "🐘", 20);
    }
  }, [matched, cards.length, done, moves, submitScore, unlockAchievement]);

  const flip = (i: number) => {
    if (flipped.length === 2 || flipped.includes(i) || matched.has(i)) return;
    if (flipped.length === 1) setMoves((m) => m + 1);
    setFlipped((f) => [...f, i]);
  };

  const reset = () => { setSeed((s) => s + 1); setFlipped([]); setMatched(new Set()); setMoves(0); setDone(false); };

  if (done) {
    return <GameOver score={Math.max(10, 200 - moves * 5)} onReplay={reset}>
      <p className="text-sm text-ink-soft">{moves} moves</p>
    </GameOver>;
  }

  return (
    <div>
      <p className="mb-4 text-center text-xs font-bold text-ink-soft">
        Moves: {moves} · Pairs {matched.size / 2}/{EMOJIS.length}
      </p>
      <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">
        {cards.map((emoji, i) => {
          const isUp = flipped.includes(i) || matched.has(i);
          return (
            <motion.button
              key={i}
              onClick={() => flip(i)}
              whileTap={{ scale: 0.92 }}
              className="relative aspect-square [perspective:600px]"
              aria-label={isUp ? emoji : "Hidden card"}
              disabled={matched.has(i)}
            >
              <motion.span
                animate={{ rotateY: isUp ? 180 : 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 [transform-style:preserve-3d]"
              >
                <span className="absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-blush-400 to-lilac-500 text-xl text-white [backface-visibility:hidden]">
                  💠
                </span>
                <span className={cn(
                  "absolute inset-0 grid place-items-center rounded-2xl text-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]",
                  matched.has(i) ? "bg-emerald-100 dark:bg-emerald-500/20" : "glass",
                )}>
                  {emoji}
                </span>
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
