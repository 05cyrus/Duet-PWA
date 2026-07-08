"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  hover?: boolean;
  padded?: boolean;
  children?: React.ReactNode;
}

/** Rounded glassmorphic card — the base surface of the whole app. */
export function GlassCard({ className, hover = false, padded = true, children, ...rest }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn("glass rounded-3xl", padded && "p-5", className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
