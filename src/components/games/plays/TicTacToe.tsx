"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGameScore } from "@/hooks/useGameScore";
import { gameById } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

type Cell = "❤️" | "💋" | null;

function winner(b: Cell[]): { mark: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { mark: b[a], line };
  }
  return null;
}

export function TicTacToe() {
  const game = gameById("tic-tac-toe")!;
  const { submitScore } = useGameScore(game);
  const { myName, partnerName } = useCouple();

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"❤️" | "💋">("❤️");
  const [series, setSeries] = useState({ "❤️": 0, "💋": 0 });

  const win = winner(board);
  const draw = !win && board.every(Boolean);

  const play = (i: number) => {
    if (board[i] || win) return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    const w = winner(next);
    if (w) {
      setSeries((s) => {
        const updated = { ...s, [w.mark!]: s[w.mark as "❤️" | "💋"] + 1 };
        submitScore(10, { winner: w.mark === "❤️" ? myName : partnerName });
        return updated;
      });
    } else {
      setTurn(turn === "❤️" ? "💋" : "❤️");
    }
  };

  const nextRound = () => { setBoard(Array(9).fill(null)); setTurn("❤️"); };

  return (
    <div className="text-center">
      <div className="mb-4 flex justify-center gap-8 text-sm font-bold">
        <span>❤️ {myName}: {series["❤️"]}</span>
        <span>💋 {partnerName}: {series["💋"]}</span>
      </div>

      <p className="mb-4 text-sm font-semibold text-ink-soft" aria-live="polite">
        {win ? `${win.mark} wins the round! 🎉` : draw ? "It's a draw 🤝" : `${turn} to play`}
      </p>

      <div className="mx-auto grid w-fit grid-cols-3 gap-1.5">
        {board.map((cell, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => play(i)}
            aria-label={cell ?? `Empty cell ${i + 1}`}
            className={`grid size-20 place-items-center rounded-2xl text-3xl transition-colors ${
              win?.line.includes(i) ? "bg-emerald-100 dark:bg-emerald-500/25" : "bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
          >
            {cell && (
              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                {cell}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>

      {(win || draw) && (
        <Button className="mt-5" onClick={nextRound}>Next round</Button>
      )}
    </div>
  );
}
