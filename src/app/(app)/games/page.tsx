"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GAMES, GEOMETRY_GAME } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const pop = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 20 } },
};

export default function GamesPage() {
  const { couple } = useCouple();

  return (
    <div>
      <PageHeader emoji="🎮" title="Love Games" subtitle={`Play together, earn XP & coins — ${couple?.coins ?? 0} 🪙 so far.`} />

      {/* Featured: Geometry Track */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/games/geometry"
          className="group relative mb-6 block overflow-hidden rounded-3xl bg-gradient-to-r from-blush-500 via-fuchsia-500 to-lilac-600 p-6 text-white shadow-xl shadow-blush-500/20"
        >
          <div aria-hidden className="absolute -right-6 -top-8 text-8xl opacity-25 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            🚀
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">Featured</p>
          <h2 className="mt-1 text-2xl font-bold">{GEOMETRY_GAME.name} {GEOMETRY_GAME.emoji}</h2>
          <p className="mt-1 max-w-sm text-sm text-white/85">
            Dash, jump and fly through the love track. Coins, checkpoints, skins & a leaderboard.
          </p>
          <span className="mt-4 inline-block rounded-2xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur transition-transform group-hover:scale-105">
            Play now →
          </span>
        </Link>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GAMES.map((g) => (
          <motion.div key={g.id} variants={pop}>
            <Link
              href={`/games/${g.id}`}
              className="glass group flex h-full flex-col rounded-3xl p-4 transition-transform hover:-translate-y-1"
            >
              <span aria-hidden className="text-3xl transition-transform duration-300 group-hover:scale-125">
                {g.emoji}
              </span>
              <h3 className="mt-2 text-sm font-bold">{g.name}</h3>
              <p className="mt-0.5 flex-1 text-xs text-ink-soft">{g.tagline}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-lilac-500">
                {g.players === "pass-and-play" ? "🤝 together" : "🎯 solo or vs"} · +{g.xp} XP
              </p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
