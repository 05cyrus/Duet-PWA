"use client";

import { motion } from "framer-motion";

interface PageHeaderProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ emoji, title, subtitle, action }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blush-100 to-lilac-100 text-2xl dark:from-blush-500/20 dark:to-lilac-500/20">
          {emoji}
        </span>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {action}
    </motion.header>
  );
}
