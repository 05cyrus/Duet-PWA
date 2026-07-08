"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <Link
        href="/"
        className="mb-6 text-3xl font-bold gradient-text"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Duet
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="glass w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        {children}
      </motion.div>
    </main>
  );
}
