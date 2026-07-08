"use client";

import dynamic from "next/dynamic";
import { notFound, useParams } from "next/navigation";
import { GameShell } from "@/components/games/GameShell";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { gameById } from "@/lib/games/registry";

const loading = () => <CardSkeleton rows={5} />;

/** Dynamic imports keep each game in its own JS chunk. */
const PLAYS: Record<string, React.ComponentType> = {
  "love-quiz": dynamic(() => import("@/components/games/plays/LoveQuiz").then((m) => m.LoveQuiz), { loading }),
  "couple-trivia": dynamic(() => import("@/components/games/plays/CoupleTrivia").then((m) => m.CoupleTrivia), { loading }),
  "this-or-that": dynamic(() => import("@/components/games/plays/ThisOrThat").then((m) => m.ThisOrThat), { loading }),
  "truth-or-dare": dynamic(() => import("@/components/games/plays/TruthOrDare").then((m) => m.TruthOrDare), { loading }),
  "never-have-i": dynamic(() => import("@/components/games/plays/NeverHaveI").then((m) => m.NeverHaveI), { loading }),
  "spin-bottle": dynamic(() => import("@/components/games/plays/SpinBottle").then((m) => m.SpinBottle), { loading }),
  "guess-emoji": dynamic(() => import("@/components/games/plays/GuessEmoji").then((m) => m.GuessEmoji), { loading }),
  "memory-match": dynamic(() => import("@/components/games/plays/MemoryMatch").then((m) => m.MemoryMatch), { loading }),
  "sliding-puzzle": dynamic(() => import("@/components/games/plays/SlidingPuzzle").then((m) => m.SlidingPuzzle), { loading }),
  "tic-tac-toe": dynamic(() => import("@/components/games/plays/TicTacToe").then((m) => m.TicTacToe), { loading }),
  "connect-four": dynamic(() => import("@/components/games/plays/ConnectFour").then((m) => m.ConnectFour), { loading }),
  hangman: dynamic(() => import("@/components/games/plays/Hangman").then((m) => m.Hangman), { loading }),
  "word-search": dynamic(() => import("@/components/games/plays/WordSearch").then((m) => m.WordSearch), { loading }),
  "love-bingo": dynamic(() => import("@/components/games/plays/LoveBingo").then((m) => m.LoveBingo), { loading }),
  "daily-challenge": dynamic(() => import("@/components/games/plays/DailyChallenge").then((m) => m.DailyChallenge), { loading }),
};

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameById(gameId);
  const Play = PLAYS[gameId];
  if (!game || !Play) notFound();

  return (
    <GameShell game={game}>
      <Play />
    </GameShell>
  );
}
