"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOnline } from "@/hooks/useOnline";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationsBell } from "./NotificationsBell";
import { ALL_NAV, PRIMARY_NAV, SECONDARY_NAV } from "./nav";

/**
 * Authenticated app frame: glass sidebar on desktop, bottom bar on mobile.
 * Redirects signed-out users to /login and un-paired users to /pair.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, configured } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();
  const pathname = usePathname();
  const router = useRouter();
  const online = useOnline();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (authLoading || coupleLoading) return;
    if (!user) router.replace("/login");
    else if (!couple || !couple.anniversary) router.replace("/pair");
  }, [authLoading, coupleLoading, user, couple, router]);

  useEffect(() => setMoreOpen(false), [pathname]);

  if (!configured) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="glass max-w-md space-y-3 rounded-3xl p-8">
          <span className="text-4xl" aria-hidden>🔧</span>
          <h1 className="text-lg font-bold">Firebase isn&apos;t configured yet</h1>
          <p className="text-sm text-ink-soft">
            Copy <code className="rounded bg-blush-100 px-1 dark:bg-white/10">.env.example</code> to{" "}
            <code className="rounded bg-blush-100 px-1 dark:bg-white/10">.env.local</code> and fill in
            your Firebase project keys, then restart the dev server.
          </p>
        </div>
      </main>
    );
  }

  if (authLoading || coupleLoading || !user || !couple?.anniversary) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <span className="heartbeat inline-block text-5xl" aria-hidden>💞</span>
          <p className="mt-3 text-sm text-ink-soft">Warming up your universe…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto p-4 lg:flex">
        <Link href="/dashboard" className="mb-4 px-3 text-3xl font-bold gradient-text" style={{ fontFamily: "var(--font-display)" }}>
          Duet
        </Link>
        {ALL_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors",
                active ? "text-blush-600 dark:text-blush-300" : "text-ink-soft hover:bg-white/40 hover:text-ink dark:hover:bg-white/5",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-white/70 shadow-sm dark:bg-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 text-lg" aria-hidden>{item.emoji}</span>
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="pt-safe sticky top-0 z-30">
          <div className="glass mx-3 mt-2 flex items-center justify-between rounded-2xl px-4 py-2.5 lg:mx-4">
            <Link href="/dashboard" className="text-xl font-bold gradient-text lg:hidden" style={{ fontFamily: "var(--font-display)" }}>
              Duet
            </Link>
            <p className="hidden text-sm font-semibold text-ink-soft lg:block">
              {couple.coupleName} <span aria-hidden>·</span> 💞
            </p>
            <div className="flex items-center gap-2">
              {!online && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Offline
                </span>
              )}
              <NotificationsBell />
              <Link href="/profile" aria-label="Profile" className="flex -space-x-2">
                {couple.members.map((uid) => (
                  <Avatar
                    key={uid}
                    src={couple.memberPhotos[uid]}
                    name={couple.memberNames[uid] ?? "?"}
                    size={30}
                  />
                ))}
              </Link>
            </div>
          </div>
        </header>

        {/* Page content with route transitions */}
        <main className="min-w-0 flex-1 px-3 pb-28 pt-4 lg:px-6 lg:pb-10">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 lg:hidden" aria-label="Primary">
        <div className="glass mx-3 mb-2 grid grid-cols-5 rounded-3xl px-2 py-1.5">
          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 rounded-2xl py-1.5"
              >
                <motion.span whileTap={{ scale: 0.85 }} className={cn("text-xl transition-transform", active && "scale-110")} aria-hidden>
                  {item.emoji}
                </motion.span>
                <span className={cn("text-[10px] font-bold", active ? "text-blush-500" : "text-ink-soft")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className="flex flex-col items-center gap-0.5 rounded-2xl py-1.5"
          >
            <span className="text-xl" aria-hidden>✨</span>
            <span className={cn("text-[10px] font-bold", moreOpen ? "text-blush-500" : "text-ink-soft")}>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong absolute inset-x-0 bottom-0 grid grid-cols-4 gap-2 rounded-t-3xl p-4 pb-24"
            >
              {SECONDARY_NAV.map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-1 rounded-2xl py-3 transition-colors hover:bg-white/50 dark:hover:bg-white/10">
                  <span className="text-2xl" aria-hidden>{item.emoji}</span>
                  <span className="text-[11px] font-semibold text-ink-soft">{item.label}</span>
                </Link>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
