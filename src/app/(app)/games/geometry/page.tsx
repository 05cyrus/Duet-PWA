"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/Skeleton";

// Canvas game is client-only and heavy — load it lazily.
const GeometryTrack = dynamic(
  () => import("@/components/games/geometry/GeometryTrack").then((m) => m.GeometryTrack),
  { ssr: false, loading: () => <CardSkeleton rows={8} /> },
);

export default function GeometryPage() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/games" aria-label="Back to games"
          className="glass grid size-10 place-items-center rounded-2xl text-lg transition-transform hover:-translate-x-0.5">
          ←
        </Link>
        <div>
          <h1 className="text-lg font-bold">🚀 Geometry Track</h1>
          <p className="text-xs text-ink-soft">Dash through the love track — works offline!</p>
        </div>
      </div>
      <GeometryTrack />
    </div>
  );
}
