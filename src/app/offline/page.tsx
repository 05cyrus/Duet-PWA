"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * Offline fallback page — served by the service worker when a navigation
 * fails and the target page isn't cached.
 */
export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <motion.p
          aria-hidden
          className="text-7xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          🕊️
        </motion.p>
        <h1 className="mt-4 text-2xl font-bold">You&apos;re offline</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
          No connection right now — but pages you&apos;ve visited, your games and
          anything you write will sync when you&apos;re back online.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => location.reload()}
            className="gradient-btn rounded-2xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <Link href="/games/geometry" className="glass rounded-2xl px-5 py-2.5 text-sm font-semibold">
            Play offline 🚀
          </Link>
        </div>
      </div>
    </main>
  );
}
