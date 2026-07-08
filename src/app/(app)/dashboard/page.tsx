"use client";

import { motion } from "framer-motion";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { LoveStats } from "@/components/dashboard/LoveStats";
import { MoodWidget } from "@/components/dashboard/MoodWidget";
import { QuickNotes } from "@/components/dashboard/QuickNotes";
import { QuoteCard } from "@/components/dashboard/QuoteCard";
import { TodayMemory } from "@/components/dashboard/TodayMemory";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { useLoveStats } from "@/hooks/useLoveStats";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 150, damping: 20 } },
};

export default function DashboardPage() {
  const stats = useLoveStats();

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <HeroCard loveScore={stats.loveScore} />
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <motion.div variants={fadeUp}><MoodWidget /></motion.div>
        <motion.div variants={fadeUp}><TodayMemory /></motion.div>
        <motion.div variants={fadeUp} className="md:col-span-2 xl:col-span-1">
          <UpcomingEvents />
        </motion.div>
        <motion.div variants={fadeUp}><QuoteCard /></motion.div>
        <motion.div variants={fadeUp}><WeatherCard /></motion.div>
        <motion.div variants={fadeUp}><QuickNotes /></motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <LoveStats stats={stats} />
      </motion.div>
    </motion.div>
  );
}
