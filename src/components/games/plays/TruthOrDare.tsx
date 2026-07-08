"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGameScore } from "@/hooks/useGameScore";
import { TRUTH_OR_DARE } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";

export function TruthOrDare() {
  const game = gameById("truth-or-dare")!;
  const { submitScore } = useGameScore(game);
  const { myName, partnerName } = useCouple();

  const [turn, setTurn] = useState(0);
  const [card, setCard] = useState<{ kind: "truth" | "dare"; text: string } | null>(null);
  const [completed, setCompleted] = useState(0);

  const player = turn % 2 === 0 ? myName : partnerName;

  const draw = (kind: "truth" | "dare") => {
    const deck = kind === "truth" ? TRUTH_OR_DARE.truths : TRUTH_OR_DARE.dares;
    setCard({ kind, text: deck[Math.floor(Math.random() * deck.length)] });
  };

  const finish = (didIt: boolean) => {
    if (didIt) {
      const total = completed + 1;
      setCompleted(total);
      if (total % 5 === 0) submitScore(total * 10, { completed: total });
    }
    setCard(null);
    setTurn((t) => t + 1);
  };

  return (
    <div className="text-center">
      <p className="mb-4 text-xs font-bold text-ink-soft">Completed: {completed} 🔥</p>
      <AnimatePresence mode="wait">
        {!card ? (
          <motion.div key={`pick-${turn}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <p className="mb-6 text-lg font-bold">
              <span aria-hidden>🎲</span> {player}, choose your fate:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }}
                onClick={() => draw("truth")}
                className="rounded-3xl bg-gradient-to-br from-sky-400 to-lilac-500 px-4 py-10 text-xl font-bold text-white shadow-lg">
                💬 Truth
              </motion.button>
              <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }}
                onClick={() => draw("dare")}
                className="rounded-3xl bg-gradient-to-br from-blush-500 to-peach-400 px-4 py-10 text-xl font-bold text-white shadow-lg">
                🔥 Dare
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="card" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }}>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-lilac-500">
              {card.kind === "truth" ? "💬 Truth" : "🔥 Dare"} for {player}
            </p>
            <p className="mx-auto mb-6 max-w-sm rounded-3xl bg-white/60 px-5 py-8 text-lg font-bold leading-snug dark:bg-white/5">
              {card.text}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => finish(false)}>Chicken out 🐔</Button>
              <Button onClick={() => finish(true)}>Done it! ✅</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
