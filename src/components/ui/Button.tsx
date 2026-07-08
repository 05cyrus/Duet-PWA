"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: "gradient-btn text-white shadow-lg shadow-blush-500/25",
  soft: "bg-blush-100 text-blush-600 hover:bg-blush-200 dark:bg-blush-500/15 dark:text-blush-300 dark:hover:bg-blush-500/25",
  ghost: "text-ink-soft hover:bg-blush-100/60 hover:text-blush-600 dark:hover:bg-white/5",
  outline: "border border-blush-300/60 text-blush-600 hover:bg-blush-50 dark:text-blush-300 dark:hover:bg-blush-500/10",
  danger: "bg-rose-500 text-white hover:bg-rose-600",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl",
  md: "px-4 py-2.5 text-sm rounded-2xl",
  lg: "px-6 py-3 text-base rounded-2xl",
};

export function Button({
  variant = "primary", size = "md", loading, className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant], SIZES[size], className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </motion.button>
  );
}
