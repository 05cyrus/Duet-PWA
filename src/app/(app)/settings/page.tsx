"use client";

import { collection, doc, getDocs, onSnapshot, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toggle } from "@/components/ui/Toggle";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { db } from "@/lib/firebase/client";
import { enablePushNotifications } from "@/lib/firebase/messaging";
import type { CoupleSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";

const DEFAULT_SETTINGS: CoupleSettings = {
  notifyDailyReminder: true,
  notifyAnniversary: true,
  notifyHabits: true,
  notifyMoods: true,
  notifyGames: true,
  language: "en",
  locationEnabled: true,
};

const NOTIFY_ROWS: { key: keyof CoupleSettings; label: string; hint: string }[] = [
  { key: "notifyDailyReminder", label: "Daily reminders", hint: "A gentle nudge to check in each day" },
  { key: "notifyAnniversary", label: "Anniversary countdown", hint: "Heads-up before your big days" },
  { key: "notifyHabits", label: "Habit reminders", hint: "Keep your shared streaks alive" },
  { key: "notifyMoods", label: "Mood updates", hint: "When your partner logs a mood" },
  { key: "notifyGames", label: "Games & achievements", hint: "Scores, challenges and badges" },
];

/** Sub-collections included in the JSON export. */
const EXPORT_COLLECTIONS = [
  "messages", "timeline", "gallery", "albums", "calendar", "habits", "moods",
  "bucketList", "letters", "scores", "achievements", "notes", "music", "notifications",
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { coupleId, couple } = useCouple();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { canInstall, installed, install } = useInstallPrompt();
  const router = useRouter();

  const [settings, setSettings] = useState<CoupleSettings>(DEFAULT_SETTINGS);
  const [pushBusy, setPushBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!coupleId) return;
    return onSnapshot(doc(db(), "couples", coupleId, "meta", "settings"), (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as CoupleSettings) });
    });
  }, [coupleId]);

  const updateSetting = (key: keyof CoupleSettings, value: boolean) => {
    if (!coupleId) return;
    setSettings((s) => ({ ...s, [key]: value }));
    setDoc(doc(db(), "couples", coupleId, "meta", "settings"),
      { [key]: value }, { merge: true }).catch(() => {});
  };

  const enablePush = async () => {
    if (!user) return;
    setPushBusy(true);
    const ok = await enablePushNotifications(user.uid);
    setPushBusy(false);
    toast(ok ? "Push notifications enabled 🔔" : "Couldn't enable push — check permissions & VAPID key.", ok ? "success" : "error");
  };

  const exportData = async () => {
    if (!coupleId || !couple) return;
    setExporting(true);
    try {
      const data: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        couple: { ...couple },
      };
      for (const sub of EXPORT_COLLECTIONS) {
        const snap = await getDocs(collection(db(), "couples", coupleId, sub));
        data[sub] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `duet-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Backup downloaded 📦", "success");
    } catch {
      toast("Export failed — try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader emoji="⚙️" title="Settings" subtitle="Make Duet feel like home." />

      {/* Appearance */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-bold">Appearance 🎨</h2>
        <div className="grid grid-cols-3 gap-2">
          {([["light", "☀️ Light"], ["dark", "🌙 Dark"], ["system", "💻 System"]] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              className={cn(
                "rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors",
                theme === t ? "gradient-btn text-white" : "bg-white/50 text-ink-soft dark:bg-white/5",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* App install + push */}
      <GlassCard className="space-y-4">
        <h2 className="text-sm font-bold">App 📱</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Install Duet</p>
            <p className="text-xs text-ink-soft">
              {installed ? "Installed — you're all set ✅" : "Add to your home screen for the full experience."}
            </p>
          </div>
          <Button size="sm" disabled={!canInstall} onClick={install}>
            {installed ? "Installed" : "Install"}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Push notifications</p>
            <p className="text-xs text-ink-soft">Get notified even when the app is closed.</p>
          </div>
          <Button size="sm" variant="soft" loading={pushBusy} onClick={enablePush}>Enable</Button>
        </div>
      </GlassCard>

      {/* Notification preferences */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-bold">Notifications 🔔</h2>
        <ul className="space-y-3">
          {NOTIFY_ROWS.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{row.label}</p>
                <p className="text-xs text-ink-soft">{row.hint}</p>
              </div>
              <Toggle
                checked={Boolean(settings[row.key])}
                onChange={(v) => updateSetting(row.key, v)}
                label={row.label}
              />
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* Privacy */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-bold">Privacy 🔒</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Location features</p>
            <p className="text-xs text-ink-soft">Allow the Location page for this couple.</p>
          </div>
          <Toggle checked={settings.locationEnabled}
            onChange={(v) => updateSetting("locationEnabled", v)} label="Location features" />
        </div>
        <p className="mt-3 rounded-2xl bg-lilac-100/60 px-3 py-2 text-xs text-lilac-700 dark:bg-lilac-500/10 dark:text-lilac-300">
          Your data lives in your own Firebase project and is readable only by you two —
          enforced by Firestore security rules.
        </p>
      </GlassCard>

      {/* Language */}
      <GlassCard className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">Language 🌐</h2>
          <p className="text-xs text-ink-soft">More languages coming soon.</p>
        </div>
        <span className="rounded-2xl bg-white/50 px-4 py-2 text-sm font-bold dark:bg-white/5">English</span>
      </GlassCard>

      {/* Data */}
      <GlassCard className="space-y-4">
        <h2 className="text-sm font-bold">Backup & data 📦</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Export everything</p>
            <p className="text-xs text-ink-soft">Download all your shared data as JSON.</p>
          </div>
          <Button size="sm" variant="outline" loading={exporting} onClick={exportData}>
            Export
          </Button>
        </div>
      </GlassCard>

      {/* Security / account */}
      <GlassCard className="space-y-4">
        <h2 className="text-sm font-bold">Security & account 🛡️</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Sign out</p>
            <p className="text-xs text-ink-soft">You can sign back in anytime.</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleSignOut}>Sign out</Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-rose-500">Delete account</p>
            <p className="text-xs text-ink-soft">
              Removes your login. Shared data stays with your partner.
            </p>
          </div>
          <Button
            size="sm" variant="danger"
            onClick={async () => {
              if (!user) return;
              if (!confirm("Delete your account? This cannot be undone.")) return;
              try {
                await user.delete();
                router.replace("/");
              } catch {
                toast("Please sign in again first, then retry deleting.", "error");
              }
            }}
          >
            Delete
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
