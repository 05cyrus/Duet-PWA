"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
interface Toast { id: number; kind: ToastKind; message: string }

const ToastContext = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({
  toast: () => {},
});

const KIND_STYLE: Record<ToastKind, string> = {
  success: "border-emerald-300/60 text-emerald-700 dark:text-emerald-300",
  error: "border-rose-300/60 text-rose-700 dark:text-rose-300",
  info: "border-lilac-300/60 text-lilac-600 dark:text-lilac-300",
};

const KIND_ICON: Record<ToastKind, string> = { success: "💖", error: "💔", info: "💌" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`glass pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium ${KIND_STYLE[t.kind]}`}
              role="status"
            >
              <span aria-hidden>{KIND_ICON[t.kind]}</span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
