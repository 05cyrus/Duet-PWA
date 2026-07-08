"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGameScore } from "@/hooks/useGameScore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BINGO_ITEMS } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { cn, isoToday } from "@/lib/utils";

const N = 5;

/** Deterministic daily shuffle so both partners see the same card. */
function dailyCard(dateIso: string): string[] {
  let h = 0;
  for (const ch of dateIso) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const arr = [...BINGO_ITEMS];
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, N * N);
}

function bingoLines(marked: boolean[]): number {
  let lines = 0;
  for (let r = 0; r < N; r++) if (Array.from({ length: N }, (_, c) => marked[r * N + c]).every(Boolean)) lines++;
  for (let c = 0; c < N; c++) if (Array.from({ length: N }, (_, r) => marked[r * N + c]).every(Boolean)) lines++;
  if (Array.from({ length: N }, (_, i) => marked[i * N + i]).every(Boolean)) lines++;
  if (Array.from({ length: N }, (_, i) => marked[i * N + (N - 1 - i)]).every(Boolean)) lines++;
  return lines;
}

export function LoveBingo() {
  const game = gameById("love-bingo")!;
  const { submitScore } = useGameScore(game);
  const today = isoToday();
  const card = useMemo(() => dailyCard(today), [today]);

  const [state, setState] = useLocalStorage<{ date: string; marked: boolean[]; scoredLines: number }>(
    "duet-bingo",
    { date: today, marked: Array(N * N).fill(false), scoredLines: 0 },
  );
  const current = state.date === today ? state : { date: today, marked: Array(N * N).fill(false), scoredLines: 0 };
  const lines = bingoLines(current.marked);

  const toggle = (i: number) => {
    const marked = [...current.marked];
    marked[i] = !marked[i];
    const newLines = bingoLines(marked);
    let scoredLines = current.scoredLines;
    if (newLines > scoredLines) {
      submitScore((newLines - scoredLines) * 25, { lines: newLines });
      scoredLines = newLines;
    }
    setState({ date: today, marked, scoredLines });
  };

  return (
    <div className="text-center">
      <p className="mb-3 text-xs font-semibold text-ink-soft">
        Today&apos;s card — mark what you two actually did! · <b>{lines}</b> bingo{lines === 1 ? "" : "s"} 🎉
      </p>
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1.5">
        {card.map((item, i) => (
          <motion.button
            key={item}
            whileTap={{ scale: 0.92 }}
            onClick={() => toggle(i)}
            aria-pressed={current.marked[i]}
            className={cn(
              "flex aspect-square items-center justify-center rounded-2xl p-1 text-[9px] font-bold leading-tight sm:text-[11px]",
              current.marked[i]
                ? "bg-gradient-to-br from-blush-500 to-lilac-500 text-white shadow"
                : "bg-white/60 text-ink-soft hover:bg-blush-50 dark:bg-white/10 dark:hover:bg-white/15",
            )}
          >
            {current.marked[i] ? "💖" : item}
          </motion.button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">Each new line = +25 pts. Card resets daily.</p>
    </div>
  );
}
