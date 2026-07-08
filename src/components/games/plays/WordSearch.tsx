"use client";

import { useMemo, useState } from "react";
import { GameOver } from "@/components/games/GameShell";
import { useGameScore } from "@/hooks/useGameScore";
import { WORD_SEARCH_WORDS } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

const N = 8;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Placement { word: string; cells: number[] }

/** Place words horizontally/vertically/diagonally, fill the rest randomly. */
function buildGrid(): { grid: string[]; placements: Placement[] } {
  const grid: (string | null)[] = Array(N * N).fill(null);
  const placements: Placement[] = [];
  const dirs = [[0, 1], [1, 0], [1, 1]];

  for (const word of WORD_SEARCH_WORDS) {
    let placed = false;
    for (let attempt = 0; attempt < 80 && !placed; attempt++) {
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
      const r0 = Math.floor(Math.random() * (N - (dr ? word.length : 1) + (dr ? 1 : 0)));
      const c0 = Math.floor(Math.random() * (N - (dc ? word.length : 1) + (dc ? 1 : 0)));
      const cells: number[] = [];
      let ok = true;
      for (let k = 0; k < word.length; k++) {
        const idx = (r0 + dr * k) * N + (c0 + dc * k);
        if (grid[idx] !== null && grid[idx] !== word[k]) { ok = false; break; }
        cells.push(idx);
      }
      if (ok) {
        cells.forEach((idx, k) => { grid[idx] = word[k]; });
        placements.push({ word, cells });
        placed = true;
      }
    }
  }
  return {
    grid: grid.map((c) => c ?? ALPHABET[Math.floor(Math.random() * 26)]),
    placements,
  };
}

export function WordSearch() {
  const game = gameById("word-search")!;
  const { submitScore } = useGameScore(game);

  const [seed, setSeed] = useState(0);
  const { grid, placements } = useMemo(buildGrid, [seed]);
  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<Placement[]>([]);
  const [done, setDone] = useState(false);

  const foundCells = useMemo(() => new Set(found.flatMap((f) => f.cells)), [found]);

  const tap = (idx: number) => {
    if (done) return;
    // First tap starts a path; second tap on a straight line completes it.
    if (path.length === 0) { setPath([idx]); return; }
    const start = path[0];
    const r0 = Math.floor(start / N), c0 = start % N;
    const r1 = Math.floor(idx / N), c1 = idx % N;
    const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
    const straight = r0 === r1 || c0 === c1 || Math.abs(r1 - r0) === Math.abs(c1 - c0);
    if (!straight || (r0 === r1 && c0 === c1)) { setPath([idx]); return; }

    const cells: number[] = [];
    let r = r0, c = c0;
    while (true) {
      cells.push(r * N + c);
      if (r === r1 && c === c1) break;
      r += dr; c += dc;
    }
    const selWord = cells.map((i) => grid[i]).join("");
    const reversed = [...selWord].reverse().join("");
    const hit = placements.find(
      (p) => !found.includes(p) && (p.word === selWord || p.word === reversed),
    );
    if (hit) {
      const nextFound = [...found, hit];
      setFound(nextFound);
      if (nextFound.length === placements.length) {
        setDone(true);
        submitScore(placements.length * 10, { words: placements.length });
      }
    }
    setPath([]);
  };

  const reset = () => { setSeed((s) => s + 1); setPath([]); setFound([]); setDone(false); };

  if (done) return <GameOver score={placements.length * 10} onReplay={reset} />;

  return (
    <div className="text-center">
      <p className="mb-3 text-xs font-semibold text-ink-soft">
        Tap the first and last letter of a word · {found.length}/{placements.length} found
      </p>
      <div className="mx-auto grid w-fit grid-cols-8 gap-1">
        {grid.map((ch, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            aria-label={`Letter ${ch}`}
            className={cn(
              "grid size-9 place-items-center rounded-lg text-sm font-bold transition-colors sm:size-10",
              foundCells.has(i)
                ? "bg-gradient-to-br from-blush-400 to-lilac-500 text-white"
                : path.includes(i)
                  ? "bg-peach-200 text-ink dark:bg-peach-400/40"
                  : "bg-white/60 hover:bg-blush-100 dark:bg-white/10 dark:hover:bg-white/20",
            )}
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {placements.map((p) => (
          <span key={p.word} className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            found.includes(p)
              ? "bg-emerald-100 text-emerald-700 line-through dark:bg-emerald-500/20 dark:text-emerald-300"
              : "bg-white/60 text-ink-soft dark:bg-white/10",
          )}>
            {p.word}
          </span>
        ))}
      </div>
    </div>
  );
}
