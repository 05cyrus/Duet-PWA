"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { useGameScore } from "@/hooks/useGameScore";
import { HANGMAN_WORDS } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

const LIVES = 6;
const KEYS = "abcdefghijklmnopqrstuvwxyz".split("");

export function Hangman() {
  const game = gameById("hangman")!;
  const { submitScore } = useGameScore(game);

  const [seed, setSeed] = useState(0);
  const word = useMemo(
    () => HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  const [guessed, setGuessed] = useState<Set<string>>(new Set());

  const wrong = [...guessed].filter((g) => !word.includes(g)).length;
  const livesLeft = LIVES - wrong;
  const won = word.split("").every((ch) => guessed.has(ch));
  const lost = livesLeft <= 0;

  const pick = (letter: string) => {
    if (guessed.has(letter) || won || lost) return;
    const next = new Set(guessed).add(letter);
    setGuessed(next);
    const nowWon = word.split("").every((ch) => next.has(ch));
    const nowWrong = [...next].filter((g) => !word.includes(g)).length;
    if (nowWon) submitScore((LIVES - nowWrong) * 10 + 20, { word });
    else if (nowWrong >= LIVES) submitScore(0, { word });
  };

  const reset = () => { setSeed((s) => s + 1); setGuessed(new Set()); };

  if (won || lost) {
    return (
      <GameOver
        score={won ? livesLeft * 10 + 20 : 0}
        label={won ? "You saved the heart! 💖" : `The word was "${word}"`}
        onReplay={reset}
      />
    );
  }

  return (
    <div className="text-center">
      {/* Hearts as lives */}
      <p className="mb-2 text-xl tracking-wide" aria-label={`${livesLeft} of ${LIVES} lives left`}>
        {"❤️".repeat(livesLeft)}{"💔".repeat(wrong)}
      </p>
      <p className="mb-6 flex flex-wrap justify-center gap-1.5 text-2xl font-bold tracking-widest" aria-label="Word to guess">
        {word.split("").map((ch, i) => (
          <span key={i} className="grid size-10 place-items-center rounded-xl bg-white/50 dark:bg-white/5">
            {guessed.has(ch) ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>{ch.toUpperCase()}</motion.span>
            ) : (
              <span className="text-blush-300">_</span>
            )}
          </span>
        ))}
      </p>

      <div className="mx-auto grid max-w-sm grid-cols-7 gap-1.5">
        {KEYS.map((k) => {
          const used = guessed.has(k);
          const good = used && word.includes(k);
          return (
            <button
              key={k}
              onClick={() => pick(k)}
              disabled={used}
              className={cn(
                "grid aspect-square place-items-center rounded-xl text-sm font-bold uppercase transition-colors",
                !used && "bg-white/60 hover:bg-blush-100 dark:bg-white/10 dark:hover:bg-white/20",
                used && good && "bg-emerald-200 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200",
                used && !good && "bg-rose-200 text-rose-500 opacity-60 dark:bg-rose-500/20",
              )}
              aria-label={`Letter ${k}${used ? ", used" : ""}`}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
