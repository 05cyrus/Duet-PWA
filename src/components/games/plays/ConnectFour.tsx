"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGameScore } from "@/hooks/useGameScore";
import { gameById } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";

const COLS = 7, ROWS = 6;
type Cell = 0 | 1 | null;

function checkWin(grid: Cell[][], player: 0 | 1): [number, number][] | null {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        const cells: [number, number][] = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc] !== player) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return cells;
      }
    }
  }
  return null;
}

export function ConnectFour() {
  const game = gameById("connect-four")!;
  const { submitScore } = useGameScore(game);
  const { myName, partnerName } = useCouple();

  const empty = () => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
  const [grid, setGrid] = useState<Cell[][]>(empty);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [winCells, setWinCells] = useState<[number, number][] | null>(null);
  const [series, setSeries] = useState<[number, number]>([0, 0]);

  const names = [myName, partnerName];
  const tokens = ["🔴", "🟡"];
  const full = grid[0].every((c) => c !== null);

  const drop = (col: number) => {
    if (winCells || full) return;
    const next = grid.map((row) => [...row]);
    let landed = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (next[r][col] === null) { next[r][col] = turn; landed = r; break; }
    }
    if (landed === -1) return;
    setGrid(next);
    const w = checkWin(next, turn);
    if (w) {
      setWinCells(w);
      setSeries((s) => turn === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]);
      submitScore(15, { winner: names[turn] });
    } else {
      setTurn(turn === 0 ? 1 : 0);
    }
  };

  const nextRound = () => { setGrid(empty()); setWinCells(null); setTurn(0); };

  return (
    <div className="text-center">
      <div className="mb-3 flex justify-center gap-8 text-sm font-bold">
        <span>🔴 {myName}: {series[0]}</span>
        <span>🟡 {partnerName}: {series[1]}</span>
      </div>
      <p className="mb-4 text-sm font-semibold text-ink-soft" aria-live="polite">
        {winCells ? `${tokens[turn]} ${names[turn]} wins! 🎉` : full ? "Board full — draw 🤝" : `${tokens[turn]} ${names[turn]}'s turn`}
      </p>

      <div className="mx-auto w-fit rounded-3xl bg-gradient-to-br from-lilac-500 to-blush-500 p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => drop(c)}
                aria-label={`Drop in column ${c + 1}`}
                className="grid size-9 place-items-center rounded-full bg-white/25 sm:size-11"
              >
                {cell !== null && (
                  <motion.span
                    initial={{ y: -160, opacity: 0.6 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className={`text-xl sm:text-2xl ${winCells?.some(([wr, wc]) => wr === r && wc === c) ? "drop-shadow-[0_0_6px_white]" : ""}`}
                  >
                    {tokens[cell]}
                  </motion.span>
                )}
              </button>
            )),
          )}
        </div>
      </div>

      {(winCells || full) && <Button className="mt-5" onClick={nextRound}>Next round</Button>}
    </div>
  );
}
