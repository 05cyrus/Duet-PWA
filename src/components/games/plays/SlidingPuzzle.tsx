"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { useGameScore } from "@/hooks/useGameScore";
import { gameById } from "@/lib/games/registry";

const SIZE = 3;
const TILES = ["💘", "🌹", "💌", "🧸", "💍", "🌙", "⭐", "🍫"]; // 8 tiles + blank

/** Generate a solvable shuffle by applying random legal moves from solved state. */
function shuffled(): number[] {
  const board = [...Array(SIZE * SIZE).keys()]; // 8 = blank
  let blank = SIZE * SIZE - 1;
  for (let n = 0; n < 120; n++) {
    const neighbors = [blank - SIZE, blank + SIZE, blank % SIZE > 0 ? blank - 1 : -1, blank % SIZE < SIZE - 1 ? blank + 1 : -1]
      .filter((p) => p >= 0 && p < SIZE * SIZE);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    [board[blank], board[pick]] = [board[pick], board[blank]];
    blank = pick;
  }
  return board;
}

export function SlidingPuzzle() {
  const game = gameById("sliding-puzzle")!;
  const { submitScore } = useGameScore(game);

  const [seed, setSeed] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => shuffled(), [seed]);
  const [board, setBoard] = useState(initial);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const tryMove = (i: number) => {
    if (done) return;
    const blank = board.indexOf(SIZE * SIZE - 1);
    const sameRow = Math.floor(i / SIZE) === Math.floor(blank / SIZE) && Math.abs(i - blank) === 1;
    const sameCol = Math.abs(i - blank) === SIZE;
    if (!sameRow && !sameCol) return;
    const next = [...board];
    [next[i], next[blank]] = [next[blank], next[i]];
    setBoard(next);
    const m = moves + 1;
    setMoves(m);
    if (next.every((v, idx) => v === idx)) {
      setDone(true);
      submitScore(Math.max(10, 300 - m * 3), { moves: m });
    }
  };

  const reset = () => { setSeed((s) => s + 1); setBoard(shuffled()); setMoves(0); setDone(false); };

  if (done) {
    return <GameOver score={Math.max(10, 300 - moves * 3)} onReplay={reset}>
      <p className="text-sm text-ink-soft">Solved in {moves} moves</p>
    </GameOver>;
  }

  return (
    <div className="text-center">
      <p className="mb-4 text-xs font-bold text-ink-soft">Moves: {moves} — arrange 💘 🌹 💌 / 🧸 💍 🌙 / ⭐ 🍫</p>
      <div className="mx-auto grid w-fit grid-cols-3 gap-1.5 rounded-3xl bg-white/40 p-2 dark:bg-white/5">
        {board.map((tile, i) => (
          tile === SIZE * SIZE - 1 ? (
            <span key={tile} className="size-20" aria-hidden />
          ) : (
            <motion.button
              key={tile}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              onClick={() => tryMove(i)}
              className="grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-white/90 to-blush-50 text-3xl shadow dark:from-white/15 dark:to-white/5"
              aria-label={`Tile ${TILES[tile]}`}
            >
              {TILES[tile]}
            </motion.button>
          )
        ))}
      </div>
    </div>
  );
}
