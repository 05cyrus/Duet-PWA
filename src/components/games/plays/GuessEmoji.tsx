"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useGameScore } from "@/hooks/useGameScore";
import { EMOJI_PUZZLES } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";

const ROUNDS = 8;

export function GuessEmoji() {
  const game = gameById("guess-emoji")!;
  const { submitScore, unlockAchievement } = useGameScore(game);

  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState("");
  const [hintUsed, setHintUsed] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "right" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const deck = useMemo(
    () => [...EMOJI_PUZZLES].sort(() => 0.5 - Math.random()).slice(0, ROUNDS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  const puzzle = deck[i];

  const advance = (points: number) => {
    const total = score + points;
    setScore(total);
    if (i + 1 >= deck.length) {
      setDone(true);
      submitScore(total, { rounds: deck.length });
      if (total >= deck.length * 10) unlockAchievement("emoji-master", "Emoji Whisperer", "🧩", 20);
    } else {
      setI(i + 1);
      setGuess("");
      setHintUsed(false);
      setFeedback("idle");
    }
  };

  const check = () => {
    const clean = guess.trim().toLowerCase().replace(/\s+/g, " ");
    if (!clean) return;
    if (clean === puzzle.answer) {
      setFeedback("right");
      setTimeout(() => advance(hintUsed ? 5 : 10), 800);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback("idle"), 700);
    }
  };

  const reset = () => { setSeed((s) => s + 1); setI(0); setGuess(""); setHintUsed(false); setFeedback("idle"); setScore(0); setDone(false); };

  if (done) return <GameOver score={score} onReplay={reset} />;

  return (
    <div className="text-center">
      <p className="mb-4 text-xs font-bold text-ink-soft">Puzzle {i + 1}/{deck.length} · Score {score}</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          className="mb-6 text-5xl leading-relaxed tracking-wider"
          aria-label="Emoji puzzle"
        >
          {puzzle.emojis}
        </motion.p>
      </AnimatePresence>

      <motion.div animate={feedback === "wrong" ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
        <form onSubmit={(e) => { e.preventDefault(); check(); }} className="mx-auto max-w-xs space-y-3">
          <Input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="What's the phrase?"
            aria-label="Your guess"
            className={feedback === "right" ? "[&_input]:border-emerald-400" : ""}
          />
          <div className="flex justify-center gap-2">
            <Button type="button" variant="outline" disabled={hintUsed} onClick={() => setHintUsed(true)}>
              💡 Hint (-5)
            </Button>
            <Button type="submit">{feedback === "right" ? "Correct! 🎉" : "Guess"}</Button>
            <Button type="button" variant="ghost" onClick={() => advance(0)}>Skip</Button>
          </div>
        </form>
      </motion.div>
      {hintUsed && <p className="mt-3 text-sm font-semibold text-lilac-500">Hint: {puzzle.hint}</p>}
    </div>
  );
}
