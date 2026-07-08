"use client";

import { motion } from "framer-motion";

/** Cute inline SVG illustration — two blobby characters holding a heart. */
export function CoupleHearts({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} role="img" aria-label="Two cute characters holding a heart">
      <defs>
        <linearGradient id="ch-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7195" />
          <stop offset="100%" stopColor="#f43f6e" />
        </linearGradient>
        <linearGradient id="ch-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b3ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="ch-h" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f43f6e" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="160" cy="200" rx="120" ry="14" fill="currentColor" opacity="0.08" />

      {/* left blob */}
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
        <path d="M60 190c-22 0-34-18-30-44 4-28 18-52 44-52s40 24 44 52c4 26-8 44-30 44H60z" fill="url(#ch-a)" />
        <circle cx="74" cy="128" r="5" fill="#3d2c3a" />
        <circle cx="102" cy="128" r="5" fill="#3d2c3a" />
        <path d="M80 144q9 8 18 0" stroke="#3d2c3a" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="66" cy="142" r="6" fill="#ffffff" opacity="0.5" />
        <circle cx="112" cy="142" r="6" fill="#ffffff" opacity="0.5" />
      </motion.g>

      {/* right blob */}
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.4 }}>
        <path d="M232 190c-22 0-34-18-30-44 4-28 18-52 44-52s40 24 44 52c4 26-8 44-30 44h-28z" fill="url(#ch-b)" />
        <circle cx="246" cy="128" r="5" fill="#3d2c3a" />
        <circle cx="274" cy="128" r="5" fill="#3d2c3a" />
        <path d="M252 144q9 8 18 0" stroke="#3d2c3a" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="238" cy="142" r="6" fill="#ffffff" opacity="0.5" />
        <circle cx="284" cy="142" r="6" fill="#ffffff" opacity="0.5" />
      </motion.g>

      {/* shared heart */}
      <motion.g
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        style={{ originX: "160px", originY: "95px" }}
      >
        <path
          d="M160 120c-20-16-34-27-34-42a19 19 0 0 1 34-12 19 19 0 0 1 34 12c0 15-14 26-34 42z"
          fill="url(#ch-h)"
        />
      </motion.g>

      {/* sparkles */}
      {[[36, 60], [286, 52], [150, 30], [230, 24], [84, 34]].map(([x, y], i) => (
        <motion.circle
          key={i} cx={x} cy={y} r="3" fill="#fdba74"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.35 }}
        />
      ))}
    </svg>
  );
}
