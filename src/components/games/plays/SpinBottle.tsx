"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGameScore } from "@/hooks/useGameScore";
import { SPIN_PROMPTS } from "@/lib/games/decks";
import { gameById } from "@/lib/games/registry";
import { useCouple } from "@/providers/CoupleProvider";

export function SpinBottle() {
  const game = gameById("spin-bottle")!;
  const { submitScore } = useGameScore(game);
  const { myName, partnerName } = useCouple();
  const controls = useAnimationControls();
  const rotation = useRef(0);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ who: string; prompt: string } | null>(null);
  const [spins, setSpins] = useState(0);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const extra = 1440 + Math.random() * 720; // 4–6 full turns
    rotation.current += extra;
    await controls.start({
      rotate: rotation.current,
      transition: { duration: 2.6, ease: [0.15, 0.6, 0.2, 1] },
    });
    const angle = rotation.current % 360;
    const who = angle >= 90 && angle < 270 ? partnerName : myName;
    const prompt = SPIN_PROMPTS[Math.floor(Math.random() * SPIN_PROMPTS.length)];
    setResult({ who, prompt });
    setSpinning(false);
    const total = spins + 1;
    setSpins(total);
    if (total % 5 === 0) submitScore(total * 5, { spins: total });
  };

  return (
    <div className="text-center">
      <div className="relative mx-auto my-6 grid size-56 place-items-center rounded-full border-4 border-dashed border-blush-300/50">
        <span className="absolute -top-3 text-xl" aria-hidden>🔻</span>
        <p className="absolute top-6 text-xs font-bold text-ink-soft">{myName}</p>
        <p className="absolute bottom-6 text-xs font-bold text-ink-soft">{partnerName}</p>
        <motion.div animate={controls} className="text-6xl" style={{ originX: 0.5, originY: 0.5 }} aria-hidden>
          🍾
        </motion.div>
      </div>

      {result && !spinning && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="mx-auto mb-5 max-w-xs rounded-3xl bg-gradient-to-r from-blush-100 to-lilac-100 px-4 py-4 dark:from-blush-500/15 dark:to-lilac-500/15">
          <p className="text-sm font-bold">🎯 {result.who}</p>
          <p className="mt-1 text-lg font-bold">{result.prompt}</p>
        </motion.div>
      )}

      <Button onClick={spin} loading={spinning} size="lg">
        {spinning ? "Spinning…" : "Spin the bottle 🍾"}
      </Button>
      <p className="mt-3 text-xs text-ink-soft">Spins: {spins}</p>
    </div>
  );
}
