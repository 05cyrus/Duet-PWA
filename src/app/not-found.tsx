"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <motion.p
          aria-hidden
          className="text-7xl"
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        >
          💔
        </motion.p>
        <h1 className="mt-4 text-4xl font-bold gradient-text">404</h1>
        <p className="mt-2 text-ink-soft">
          This page wandered off… but you two are still together. 💞
        </p>
        <Link
          href="/dashboard"
          className="gradient-btn mt-6 inline-block rounded-2xl px-6 py-3 font-semibold text-white shadow-lg shadow-blush-500/25"
        >
          Back to our universe
        </Link>
      </div>
    </main>
  );
}
