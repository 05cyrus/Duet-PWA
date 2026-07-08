"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { GameDef } from "@/lib/games/registry";

/** Common frame for every love game: back link, title, glass playfield. */
export function GameShell({ game, children }: { game: GameDef; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/games"
          aria-label="Back to games"
          className="glass grid size-10 place-items-center rounded-2xl text-lg transition-transform hover:-translate-x-0.5"
        >
          ←
        </Link>
        <div>
          <h1 className="text-lg font-bold">
            <span aria-hidden className="mr-1">{game.emoji}</span> {game.name}
          </h1>
          <p className="text-xs text-ink-soft">{game.tagline}</p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="glass rounded-3xl p-5"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** End-of-game panel with score + replay. */
export function GameOver({
  score, label = "Score", onReplay, children,
}: { score: number | string; label?: string; onReplay: () => void; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="flex flex-col items-center gap-3 py-8 text-center"
    >
      <span className="text-5xl" aria-hidden>🎉</span>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="text-4xl font-bold gradient-text">{score}</p>
      {children}
      <button onClick={onReplay} className="gradient-btn mt-2 rounded-2xl px-6 py-2.5 font-semibold text-white">
        Play again
      </button>
    </motion.div>
  );
}
